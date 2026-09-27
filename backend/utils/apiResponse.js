function success(res, data = null, message = 'Success', status = 200) {
  return res.status(status).json({
    success: true,
    message,
    data
  });
}

function error(res, message = 'Internal server error', status = 500, code = 'INTERNAL_ERROR', details = undefined) {
  const body = {
    success: false,
    message,
    code
  };

  if (details !== undefined) body.details = details;

  return res.status(status).json(body);
}

module.exports = { success, error };
