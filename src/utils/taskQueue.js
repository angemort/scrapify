const queue = [];

module.exports = {
    addTask: (task) => {
        queue.push(task);
        console.log(`Task added: ${JSON.stringify(task)}`);
        return { status: 'success', message: 'Task added successfully', taskId: queue.length - 1 };
    },
    getNextTask: () => {
        const task = queue.shift();
        if (task) console.log(`Next task retrieved: ${JSON.stringify(task)}`);
        return task;
    },
    getQueueStatus: () => {
        console.log(`Current queue status: ${JSON.stringify(queue)}`);
        return { queueLength: queue.length, tasks: queue };
    }
};