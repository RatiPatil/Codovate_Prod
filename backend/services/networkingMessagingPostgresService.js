const { query } = require('../config/postgres');

async function tableExists(table) {
  const r = await query(`
    SELECT EXISTS(
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema='app' AND table_name=$1
    ) AS exists
  `, [table]);
  return r.rows[0].exists;
}

async function columns(table) {
  const r = await query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema='app' AND table_name=$1
    ORDER BY ordinal_position
  `, [table]);
  return r.rows.map(x => x.column_name);
}

async function pick(table, candidates, required=true) {
  const cols = await columns(table);
  const found = candidates.find(x => cols.includes(x));
  if (!found && required) {
    const e = new Error(
      `Required column mapping missing for app.${table}: ${candidates.join(', ')}`
    );
    e.status = 500;
    e.code = 'SCHEMA_MAPPING_ERROR';
    throw e;
  }
  return found || null;
}

async function makeWhere(table, pairs) {
  const valid = [];
  for (const [candidates, value] of pairs) {
    const col = await pick(table, candidates, false);
    if (col && value !== undefined) valid.push({col, value});
  }
  return valid;
}

async function listConnections(userId) {
  if (!(await tableExists('connections'))) {
    const e = new Error('Connections module is not available in PostgreSQL schema.');
    e.status = 503;
    e.code = 'MODULE_NOT_READY';
    throw e;
  }

  const from = await pick('connections',
    ['requester_id','sender_id','from_user_id','user_id']);
  const to = await pick('connections',
    ['receiver_id','recipient_id','to_user_id','connected_user_id']);
  const status = await pick('connections',['status'],false);

  const params = [userId];
  const where = `(c."${from}"=$1 OR c."${to}"=$1)`;

  let sql = `SELECT c.* FROM app.connections c WHERE ${where}`;
  if (status) sql += ` ORDER BY c."${status}", c.created_at DESC NULLS LAST`;
  else sql += ` ORDER BY c.created_at DESC NULLS LAST`;

  const r = await query(sql, params);
  return r.rows;
}

async function sendConnectionRequest(userId, targetUserId) {
  if (String(userId) === String(targetUserId)) {
    const e = new Error('You cannot connect with yourself.');
    e.status = 400;
    e.code = 'SELF_CONNECTION';
    throw e;
  }

  if (!(await tableExists('connections'))) {
    const e = new Error('Connections module is not available in PostgreSQL schema.');
    e.status = 503;
    e.code = 'MODULE_NOT_READY';
    throw e;
  }

  const from = await pick('connections',
    ['requester_id','sender_id','from_user_id','user_id']);
  const to = await pick('connections',
    ['receiver_id','recipient_id','to_user_id','connected_user_id']);
  const status = await pick('connections',['status'],false);

  const existing = await query(`
    SELECT *
    FROM app.connections c
    WHERE (c."${from}"=$1 AND c."${to}"=$2)
       OR (c."${from}"=$2 AND c."${to}"=$1)
    LIMIT 1
  `,[userId,targetUserId]);

  if (existing.rowCount) return existing.rows[0];

  const fields = [`"${from}"`,`"${to}"`];
  const values = ['$1','$2'];
  const params = [userId,targetUserId];

  if (status) {
    fields.push(`"${status}"`);
    values.push(`'pending'`);
  }

  const r = await query(`
    INSERT INTO app.connections(${fields.join(',')})
    VALUES(${values.join(',')})
    RETURNING *
  `,params);

  return r.rows[0];
}

async function updateConnection(connectionId,userId,newStatus) {
  if (!(await tableExists('connections'))) {
    const e = new Error('Connections module is not available in PostgreSQL schema.');
    e.status = 503;
    e.code = 'MODULE_NOT_READY';
    throw e;
  }

  const from = await pick('connections',
    ['requester_id','sender_id','from_user_id','user_id']);
  const to = await pick('connections',
    ['receiver_id','recipient_id','to_user_id','connected_user_id']);
  const status = await pick('connections',['status']);

  const r = await query(`
    UPDATE app.connections
    SET "${status}"=$1
    WHERE id=$2
      AND ("${from}"=$3 OR "${to}"=$3)
    RETURNING *
  `,[newStatus,connectionId,userId]);

  if (!r.rowCount) {
    const e = new Error('Connection not found or access denied.');
    e.status = 404;
    e.code = 'CONNECTION_NOT_FOUND';
    throw e;
  }

  return r.rows[0];
}

async function listConversations(userId) {
  const needed = ['conversations','conversation_members','messages'];
  for (const t of needed) {
    if (!(await tableExists(t))) {
      const e = new Error(`Messaging table app.${t} is missing.`);
      e.status = 503;
      e.code = 'MODULE_NOT_READY';
      throw e;
    }
  }

  const cmConversation = await pick(
    'conversation_members',
    ['conversation_id','chat_id']
  );
  const cmUser = await pick(
    'conversation_members',
    ['user_id','member_id','participant_id']
  );
  const msgConversation = await pick(
    'messages',
    ['conversation_id','chat_id']
  );
  const msgCreated = await pick(
    'messages',
    ['created_at','sent_at']
  );

  const r = await query(`
    SELECT
      c.*,
      lm.id AS last_message_id,
      lm.content AS last_message_content,
      lm.created_at AS last_message_at
    FROM app.conversations c
    JOIN app.conversation_members cm
      ON cm."${cmConversation}"=c.id
    LEFT JOIN LATERAL (
      SELECT m.id,m.content,m.created_at
      FROM app.messages m
      WHERE m."${msgConversation}"=c.id
      ORDER BY m."${msgCreated}" DESC NULLS LAST
      LIMIT 1
    ) lm ON TRUE
    WHERE cm."${cmUser}"=$1
    ORDER BY lm.created_at DESC NULLS LAST,c.created_at DESC NULLS LAST
  `,[userId]);

  return r.rows;
}

async function createConversation(userId, participantIds=[], type='direct') {
  if (!(await tableExists('conversations')) ||
      !(await tableExists('conversation_members'))) {
    const e = new Error('Conversation tables are not available.');
    e.status = 503;
    e.code = 'MODULE_NOT_READY';
    throw e;
  }

  const people = [...new Set(
    [userId,...(Array.isArray(participantIds) ? participantIds : [])]
      .filter(Boolean)
      .map(String)
  )];

  if (people.length < 2) {
    const e = new Error('At least two users are required for a conversation.');
    e.status = 400;
    e.code = 'INVALID_PARTICIPANTS';
    throw e;
  }

  const userExists = await query(`
    SELECT id
    FROM app.users
    WHERE id = ANY($1::uuid[])
  `,[people]);

  if (userExists.rowCount !== people.length) {
    const e = new Error('One or more conversation participants do not exist.');
    e.status = 400;
    e.code = 'PARTICIPANT_NOT_FOUND';
    throw e;
  }

  const creator = await pick(
    'conversations',
    ['created_by','creator_id','owner_user_id'],
    false
  );
  const typeCol = await pick('conversations',['type','conversation_type'],false);

  const fields=[];
  const vals=[];
  const params=[];

  if (creator) {
    fields.push(`"${creator}"`);
    params.push(userId);
    vals.push(`$${params.length}`);
  }

  if (typeCol) {
    fields.push(`"${typeCol}"`);
    params.push(type);
    vals.push(`$${params.length}`);
  }

  const conv = fields.length
    ? await query(`
        INSERT INTO app.conversations(${fields.join(',')})
        VALUES(${vals.join(',')})
        RETURNING *
      `,params)
    : await query(`
        INSERT INTO app.conversations
        DEFAULT VALUES
        RETURNING *
      `);

  const conversationId = conv.rows[0].id;

  const memberConv = await pick(
    'conversation_members',
    ['conversation_id','chat_id']
  );
  const memberUser = await pick(
    'conversation_members',
    ['user_id','member_id','participant_id']
  );

  for (const person of people) {
    await query(`
      INSERT INTO app.conversation_members(
        "${memberConv}",
        "${memberUser}"
      )
      VALUES($1,$2)
      ON CONFLICT DO NOTHING
    `,[conversationId,person]);
  }

  return conv.rows[0];
}

async function getMessages(userId,conversationId,limit=50) {
  const cmConversation = await pick(
    'conversation_members',['conversation_id','chat_id']
  );
  const cmUser = await pick(
    'conversation_members',['user_id','member_id','participant_id']
  );
  const msgConversation = await pick(
    'messages',['conversation_id','chat_id']
  );
  const sender = await pick(
    'messages',['sender_id','from_user_id','user_id']
  );
  const content = await pick(
    'messages',['content','message','body','text']
  );
  const created = await pick(
    'messages',['created_at','sent_at']
  );

  const access = await query(`
    SELECT 1
    FROM app.conversation_members
    WHERE "${cmConversation}"=$1
      AND "${cmUser}"=$2
    LIMIT 1
  `,[conversationId,userId]);

  if (!access.rowCount) {
    const e = new Error('Conversation access denied.');
    e.status = 403;
    e.code = 'CONVERSATION_ACCESS_DENIED';
    throw e;
  }

  const safeLimit=Math.min(Math.max(Number(limit)||50,1),100);

  const r = await query(`
    SELECT m.*,u.email
    FROM app.messages m
    JOIN app.users u ON u.id=m."${sender}"
    WHERE m."${msgConversation}"=$1
    ORDER BY m."${created}" DESC
    LIMIT ${safeLimit}
  `,[conversationId]);

  return r.rows.reverse();
}

async function sendMessage(userId,conversationId,message,io) {
  const text=String(message||'').trim();

  if (!text) {
    const e=new Error('Message cannot be empty.');
    e.status=400;
    e.code='EMPTY_MESSAGE';
    throw e;
  }

  await getMessages(userId,conversationId,1);

  const msgConversation = await pick(
    'messages',['conversation_id','chat_id']
  );
  const sender = await pick(
    'messages',['sender_id','from_user_id','user_id']
  );
  const content = await pick(
    'messages',['content','message','body','text']
  );

  const fields=[`"${msgConversation}"`,`"${sender}"`,`"${content}"`];
  const vals=['$1','$2','$3'];
  const params=[conversationId,userId,text];

  const metadata=await pick(
    'messages',['metadata','meta','extra_data'],
    false
  );

  if(metadata){
    fields.push(`"${metadata}"`);
    vals.push(`'{}'::jsonb`);
  }

  const r=await query(`
    INSERT INTO app.messages(${fields.join(',')})
    VALUES(${vals.join(',')})
    RETURNING *
  `,params);

  const payload=r.rows[0];

  if (io) {
    io.to(`conversation:${conversationId}`).emit('message:new',payload);
  }

  return payload;
}

module.exports={
  listConnections,
  sendConnectionRequest,
  updateConnection,
  listConversations,
  createConversation,
  getMessages,
  sendMessage
};
