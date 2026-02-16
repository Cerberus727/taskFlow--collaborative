import labelService from './label.service.js';

export const createLabel = async (req, res) => {
  try {
    const { boardId, name, color } = req.body;
    const label = await labelService.createLabel({
      boardId,
      name,
      color,
      userId: req.user.id,
    });

    const io = req.app.get('io');
    io.to(`board:${boardId}`).emit('label:created', label);

    res.status(201).json(label);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

export const getBoardLabels = async (req, res) => {
  try {
    const { boardId } = req.params;
    const labels = await labelService.getBoardLabels(boardId, req.user.id);
    res.json(labels);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

export const updateLabel = async (req, res) => {
  try {
    const { id } = req.params;
    const label = await labelService.updateLabel(id, req.user.id, req.body);

    const io = req.app.get('io');
    io.to(`board:${label.boardId}`).emit('label:updated', label);

    res.json(label);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

export const deleteLabel = async (req, res) => {
  try {
    const { id } = req.params;
    const { boardId } = await labelService.deleteLabel(id, req.user.id);

    const io = req.app.get('io');
    io.to(`board:${boardId}`).emit('label:deleted', { id, boardId });

    res.json({ message: 'Label deleted' });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

export const addLabelToTask = async (req, res) => {
  try {
    const { taskId, labelId } = req.body;
    const result = await labelService.addLabelToTask(taskId, labelId, req.user.id);

    const io = req.app.get('io');
    io.to(`board:${result.boardId}`).emit('task:labelAdded', {
      taskId,
      labelId,
      label: result.label,
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

export const removeLabelFromTask = async (req, res) => {
  try {
    const { taskId, labelId } = req.params;
    const { boardId } = await labelService.removeLabelFromTask(taskId, labelId, req.user.id);

    const io = req.app.get('io');
    io.to(`board:${boardId}`).emit('task:labelRemoved', { taskId, labelId });

    res.json({ message: 'Label removed from task' });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};
