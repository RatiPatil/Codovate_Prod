import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Clock, MessageSquare, Paperclip, MoreHorizontal, Plus } from 'lucide-react';
import api from '../../api/axios';
import { showAlert } from '../../utils/uiUtils';

const KanbanBoard = ({ tasks, teamId, onTasksUpdate }) => {
  const [columns, setColumns] = useState([
    { id: 'To Do', title: 'To Do' },
    { id: 'In Progress', title: 'In Progress' },
    { id: 'Done', title: 'Done' }
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingTaskTo, setAddingTaskTo] = useState(null);

  const getTasksByStatus = (status) => tasks.filter(t => t.status === status);

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;

    if (source.droppableId !== destination.droppableId) {
      // Optimistic UI update
      const newStatus = destination.droppableId;
      const updatedTasks = tasks.map(t => 
        t.id === draggableId ? { ...t, status: newStatus } : t
      );
      onTasksUpdate(updatedTasks);

      // Backend update
      try {
        await api.put(`/workspace/${teamId}/tasks/${draggableId}`, { status: newStatus });
      } catch (err) {
        console.error(err);
        showAlert('Failed to update task status');
        // Rollback on fail
        onTasksUpdate(tasks);
      }
    }
  };

  const handleAddTask = async (e, status) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const res = await api.post(`/workspace/${teamId}/tasks`, {
        title: newTaskTitle,
        status: status
      });
      onTasksUpdate([res.data, ...tasks]);
      setNewTaskTitle('');
      setAddingTaskTo(null);
    } catch (err) {
      console.error(err);
      showAlert('Failed to create task');
    }
  };

  return (
    <div className="flex h-full w-full overflow-x-auto overflow-y-hidden space-x-6 pb-4 no-scrollbar">
      <DragDropContext onDragEnd={handleDragEnd}>
        {columns.map(column => (
          <div key={column.id} className="flex-shrink-0 w-80 flex flex-col bg-slate-100/70 border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                {column.title}
                <span className="text-xs bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                  {getTasksByStatus(column.id).length}
                </span>
              </h3>
              <button 
                onClick={() => setAddingTaskTo(column.id)}
                className="text-slate-500 hover:text-slate-900 p-1 hover:bg-white rounded-lg transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>

            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`flex-1 overflow-y-auto no-scrollbar transition-colors ${
                    snapshot.isDraggingOver ? 'bg-indigo-50/50 rounded-xl' : ''
                  }`}
                >
                  {addingTaskTo === column.id && (
                    <form onSubmit={(e) => handleAddTask(e, column.id)} className="mb-3">
                      <input
                        type="text"
                        autoFocus
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onBlur={() => setAddingTaskTo(null)}
                        placeholder="Task title..."
                        className="w-full bg-white border border-indigo-400 rounded-xl px-3 py-2 text-slate-900 text-sm focus:outline-none shadow-sm"
                      />
                    </form>
                  )}

                  {getTasksByStatus(column.id).map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`bg-white border border-slate-200 p-4 rounded-xl mb-3 shadow-sm group ${
                            snapshot.isDragging ? 'rotate-2 scale-105 border-indigo-500 shadow-md' : ''
                          } transition-transform`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              task.priority === 'High' ? 'bg-red-50 text-red-600 border border-red-100' :
                              task.priority === 'Medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                              'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            }`}>
                              {task.priority || 'Medium'}
                            </span>
                            <button className="text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal size={14} />
                            </button>
                          </div>
                          
                          <p className="text-slate-900 text-sm font-semibold mb-4">{task.title}</p>
                          
                          <div className="flex items-center justify-between text-slate-400">
                            {task.due_date ? (
                              <div className="flex items-center gap-1 text-xs text-slate-500">
                                <Clock size={12} />
                                <span>{new Date(task.due_date).toLocaleDateString()}</span>
                              </div>
                            ) : <div />}
                            <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[10px] text-indigo-600 font-bold">
                              {task.assignee ? task.assignee.charAt(0).toUpperCase() : '?'}
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </DragDropContext>
    </div>
  );
};

export default KanbanBoard;
