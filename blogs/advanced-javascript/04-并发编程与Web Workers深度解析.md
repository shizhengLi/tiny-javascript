# JavaScript 并发编程与 Web Workers 深度解析

JavaScript 传统的单线程模型在处理高并发和 CPU 密集型任务时存在限制。Web Workers 作为浏览器提供的多线程解决方案，为 JavaScript 带来了真正的并发能力。本文将深入探讨 JavaScript 并发编程模式和 Web Workers 的高级应用。

## 并发编程基础

### 单线程限制

```javascript
// JavaScript 单线程限制演示
class SingleThreadSimulator {
    constructor() {
        this.taskQueue = [];
        this.isProcessing = false;
        this.eventLoop = null;
    }

    // 添加任务到队列
    addTask(task, priority = 0) {
        const taskWrapper = {
            id: Date.now() + Math.random(),
            task: task,
            priority: priority,
            timestamp: Date.now(),
            status: 'pending'
        };

        this.taskQueue.push(taskWrapper);
        this.taskQueue.sort((a, b) => b.priority - a.priority);

        console.log(`添加任务 ${taskWrapper.id} (优先级: ${priority})`);
        this.processQueue();

        return taskWrapper.id;
    }

    // 处理任务队列
    processQueue() {
        if (this.isProcessing || this.taskQueue.length === 0) {
            return;
        }

        this.isProcessing = true;

        // 模拟事件循环
        this.eventLoop = setInterval(() => {
            if (this.taskQueue.length === 0) {
                clearInterval(this.eventLoop);
                this.isProcessing = false;
                return;
            }

            const currentTask = this.taskQueue.shift();
            currentTask.status = 'processing';

            console.log(`开始处理任务 ${currentTask.id}`);
            const startTime = performance.now();

            try {
                const result = currentTask.task();
                const endTime = performance.now();
                const duration = endTime - startTime;

                console.log(`任务 ${currentTask.id} 完成，耗时: ${duration.toFixed(2)}ms`);
                currentTask.status = 'completed';
            } catch (error) {
                console.error(`任务 ${currentTask.id} 失败:`, error);
                currentTask.status = 'failed';
            }
        }, 0);
    }

    // 模拟阻塞操作
    blockingOperation(duration) {
        console.log(`开始阻塞操作，持续时间: ${duration}ms`);
        const start = Date.now();
        while (Date.now() - start < duration) {
            // 阻塞主线程
        }
        console.log(`阻塞操作完成`);
    }

    // 获取队列状态
    getQueueStatus() {
        return {
            totalTasks: this.taskQueue.length,
            isProcessing: this.isProcessing,
            taskDetails: this.taskQueue.map(task => ({
                id: task.id,
                priority: task.priority,
                status: task.status,
                waitTime: Date.now() - task.timestamp
            }))
        };
    }
}

// 使用示例
const simulator = new SingleThreadSimulator();

// 添加一些任务
simulator.addTask(() => {
    console.log("任务1: 简单计算");
    return 1 + 1;
}, 1);

simulator.addTask(() => {
    console.log("任务2: 阻塞操作");
    simulator.blockingOperation(1000);
    return "阻塞完成";
}, 2);

simulator.addTask(() => {
    console.log("任务3: 异步操作");
    return new Promise(resolve => {
        setTimeout(() => resolve("异步完成"), 500);
    });
}, 1);

console.log("队列状态:", simulator.getQueueStatus());
```

### 异步并发模式

```javascript
// 异步并发模式实现
class AsyncConcurrencyManager {
    constructor(maxConcurrency = 3) {
        this.maxConcurrency = maxConcurrency;
        this.runningTasks = new Map();
        this.pendingTasks = [];
        this.taskResults = new Map();
        this.taskErrors = new Map();
    }

    // 执行并发任务
    async executeConcurrently(tasks) {
        const taskPromises = tasks.map((task, index) =>
            this.executeTask(task, index)
        );

        return Promise.allSettled(taskPromises);
    }

    // 执行单个任务
    async executeTask(task, index) {
        return new Promise((resolve, reject) => {
            const taskWrapper = {
                task: task,
                index: index,
                resolve: resolve,
                reject: reject,
                startTime: Date.now()
            };

            if (this.runningTasks.size < this.maxConcurrency) {
                this.startTask(taskWrapper);
            } else {
                this.pendingTasks.push(taskWrapper);
            }
        });
    }

    // 开始任务
    startTask(taskWrapper) {
        this.runningTasks.set(taskWrapper.index, taskWrapper);

        taskWrapper.task()
            .then(result => {
                this.taskResults.set(taskWrapper.index, result);
                taskWrapper.resolve(result);
            })
            .catch(error => {
                this.taskErrors.set(taskWrapper.index, error);
                taskWrapper.reject(error);
            })
            .finally(() => {
                this.runningTasks.delete(taskWrapper.index);
                this.processPendingTasks();
            });
    }

    // 处理等待中的任务
    processPendingTasks() {
        while (this.pendingTasks.length > 0 && this.runningTasks.size < this.maxConcurrency) {
            const nextTask = this.pendingTasks.shift();
            this.startTask(nextTask);
        }
    }

    // 批量处理
    async batchProcess(items, processor, batchSize = 10) {
        const results = [];

        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            const batchResults = await this.executeConcurrently(
                batch.map(item => () => processor(item))
            );

            results.push(...batchResults.map(result =>
                result.status === 'fulfilled' ? result.value : null
            ));
        }

        return results;
    }

    // 任务调度器
    createTaskScheduler() {
        const scheduledTasks = new Map();

        return {
            schedule: async (task, delay, id) => {
                const taskId = id || Date.now();

                const execute = async () => {
                    try {
                        const result = await task();
                        return { taskId, result, status: 'completed' };
                    } catch (error) {
                        return { taskId, error, status: 'failed' };
                    }
                };

                const timeoutId = setTimeout(execute, delay);
                scheduledTasks.set(taskId, { timeoutId, execute });

                return taskId;
            },

            cancel: (taskId) => {
                const task = scheduledTasks.get(taskId);
                if (task) {
                    clearTimeout(task.timeoutId);
                    scheduledTasks.delete(taskId);
                    return true;
                }
                return false;
            },

            getScheduledTasks: () => {
                return Array.from(scheduledTasks.keys());
            }
        };
    }

    // 获取执行统计
    getExecutionStats() {
        return {
            runningTasks: this.runningTasks.size,
            pendingTasks: this.pendingTasks.length,
            completedTasks: this.taskResults.size,
            failedTasks: this.taskErrors.size,
            maxConcurrency: this.maxConcurrency
        };
    }
}

// 使用示例
const concurrencyManager = new AsyncConcurrencyManager(2);

// 测试并发执行
async function testConcurrentExecution() {
    console.log("测试并发执行...");

    const tasks = [
        () => new Promise(resolve =>
            setTimeout(() => resolve("任务1完成"), 1000)
        ),
        () => new Promise(resolve =>
            setTimeout(() => resolve("任务2完成"), 500)
        ),
        () => new Promise(resolve =>
            setTimeout(() => resolve("任务3完成"), 1500)
        ),
        () => new Promise((_, reject) =>
            setTimeout(() => reject("任务4失败"), 800)
        )
    ];

    const results = await concurrencyManager.executeConcurrently(tasks);
    console.log("并发执行结果:", results);

    console.log("执行统计:", concurrencyManager.getExecutionStats());
}

testConcurrentExecution();
```

## Web Workers 基础

### Worker 创建与通信

```javascript
// Web Worker 基础实现
class WorkerManager {
    constructor() {
        this.workers = new Map();
        this.workerPool = [];
        this.maxWorkers = navigator.hardwareConcurrency || 4;
        this.taskQueue = [];
        this.activeTasks = new Map();
    }

    // 创建 Worker
    createWorker(script, options = {}) {
        const blob = new Blob([script], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);

        const worker = new Worker(workerUrl, options);
        const workerId = Date.now() + Math.random();

        this.workers.set(workerId, {
            worker: worker,
            url: workerUrl,
            status: 'idle',
            createdAt: Date.now(),
            taskCount: 0
        });

        this.setupWorkerHandlers(workerId, worker);
        return workerId;
    }

    // 设置 Worker 事件处理器
    setupWorkerHandlers(workerId, worker) {
        worker.onmessage = (event) => {
            this.handleWorkerMessage(workerId, event);
        };

        worker.onerror = (error) => {
            this.handleWorkerError(workerId, error);
        };

        worker.onmessageerror = (event) => {
            console.error(`Worker ${workerId} 消息错误:`, event);
        };
    }

    // 处理 Worker 消息
    handleWorkerMessage(workerId, event) {
        const workerInfo = this.workers.get(workerId);
        if (!workerInfo) return;

        const { type, data, taskId } = event.data;

        switch (type) {
            case 'result':
                this.handleTaskResult(taskId, data);
                workerInfo.status = 'idle';
                break;
            case 'error':
                this.handleTaskError(taskId, data);
                workerInfo.status = 'idle';
                break;
            case 'progress':
                this.handleTaskProgress(taskId, data);
                break;
            default:
                console.log(`Worker ${workerId} 消息:`, event.data);
        }

        // 处理队列中的下一个任务
        this.processTaskQueue();
    }

    // 处理 Worker 错误
    handleWorkerError(workerId, error) {
        console.error(`Worker ${workerId} 错误:`, error);
        const workerInfo = this.workers.get(workerId);
        if (workerInfo) {
            workerInfo.status = 'error';
        }
    }

    // 发送任务到 Worker
    sendTask(workerId, task, data) {
        const workerInfo = this.workers.get(workerId);
        if (!workerInfo) {
            throw new Error(`Worker ${workerId} 不存在`);
        }

        const taskId = Date.now() + Math.random();

        this.activeTasks.set(taskId, {
            workerId: workerId,
            task: task,
            startTime: Date.now(),
            status: 'running'
        });

        workerInfo.worker.postMessage({
            type: 'task',
            task: task,
            data: data,
            taskId: taskId
        });

        workerInfo.status = 'busy';
        workerInfo.taskCount++;

        return taskId;
    }

    // 处理任务结果
    handleTaskResult(taskId, result) {
        const taskInfo = this.activeTasks.get(taskId);
        if (!taskInfo) return;

        taskInfo.status = 'completed';
        taskInfo.result = result;
        taskInfo.endTime = Date.now();

        console.log(`任务 ${taskId} 完成，耗时: ${taskInfo.endTime - taskInfo.startTime}ms`);
    }

    // 处理任务错误
    handleTaskError(taskId, error) {
        const taskInfo = this.activeTasks.get(taskId);
        if (!taskInfo) return;

        taskInfo.status = 'failed';
        taskInfo.error = error;
        taskInfo.endTime = Date.now();

        console.error(`任务 ${taskId} 失败:`, error);
    }

    // 处理任务进度
    handleTaskProgress(taskId, progress) {
        const taskInfo = this.activeTasks.get(taskId);
        if (!taskInfo) return;

        taskInfo.progress = progress;
        console.log(`任务 ${taskId} 进度: ${progress}%`);
    }

    // 处理任务队列
    processTaskQueue() {
        // 找到空闲的 Worker
        const idleWorkers = Array.from(this.workers.entries())
            .filter(([_, info]) => info.status === 'idle');

        if (idleWorkers.length > 0 && this.taskQueue.length > 0) {
            const task = this.taskQueue.shift();
            const [workerId] = idleWorkers[0];
            this.sendTask(workerId, task.task, task.data);
        }
    }

    // 添加任务到队列
    addTask(task, data) {
        return new Promise((resolve, reject) => {
            const taskWrapper = {
                task: task,
                data: data,
                resolve: resolve,
                reject: reject,
                timestamp: Date.now()
            };

            this.taskQueue.push(taskWrapper);
            this.processTaskQueue();
        });
    }

    // 创建 Worker 池
    createWorkerPool(script, poolSize = this.maxWorkers) {
        const workers = [];

        for (let i = 0; i < poolSize; i++) {
            const workerId = this.createWorker(script);
            workers.push(workerId);
        }

        return {
            workers: workers,
            execute: (task, data) => this.addTask(task, data),
            getStats: () => this.getWorkerStats()
        };
    }

    // 获取 Worker 统计
    getWorkerStats() {
        const stats = {
            totalWorkers: this.workers.size,
            activeWorkers: 0,
            idleWorkers: 0,
            errorWorkers: 0,
            totalTasks: 0,
            averageTaskTime: 0
        };

        let totalTaskTime = 0;
        let completedTasks = 0;

        for (const [_, info] of this.workers) {
            switch (info.status) {
                case 'busy':
                    stats.activeWorkers++;
                    break;
                case 'idle':
                    stats.idleWorkers++;
                    break;
                case 'error':
                    stats.errorWorkers++;
                    break;
            }

            stats.totalTasks += info.taskCount;
        }

        for (const [_, task] of this.activeTasks) {
            if (task.status === 'completed') {
                totalTaskTime += task.endTime - task.startTime;
                completedTasks++;
            }
        }

        if (completedTasks > 0) {
            stats.averageTaskTime = totalTaskTime / completedTasks;
        }

        return stats;
    }

    // 销毁 Worker
    destroyWorker(workerId) {
        const workerInfo = this.workers.get(workerId);
        if (workerInfo) {
            workerInfo.worker.terminate();
            URL.revokeObjectURL(workerInfo.url);
            this.workers.delete(workerId);
        }
    }

    // 销毁所有 Worker
    destroyAll() {
        for (const [workerId, _] of this.workers) {
            this.destroyWorker(workerId);
        }
        this.workers.clear();
        this.taskQueue = [];
        this.activeTasks.clear();
    }
}

// Worker 脚本模板
const workerScript = `
    // Worker 端代码
    self.onmessage = function(event) {
        const { type, task, data, taskId } = event.data;

        if (type === 'task') {
            try {
                // 模拟任务处理
                const result = processTask(task, data);

                self.postMessage({
                    type: 'result',
                    data: result,
                    taskId: taskId
                });
            } catch (error) {
                self.postMessage({
                    type: 'error',
                    data: error.message,
                    taskId: taskId
                });
            }
        }
    };

    function processTask(task, data) {
        // 根据任务类型处理
        switch (task) {
            case 'calculate':
                return calculate(data);
            case 'sort':
                return sortArray(data);
            case 'search':
                return searchData(data);
            default:
                throw new Error('未知任务类型: ' + task);
        }
    }

    function calculate(data) {
        const { operation, numbers } = data;
        switch (operation) {
            case 'sum':
                return numbers.reduce((a, b) => a + b, 0);
            case 'product':
                return numbers.reduce((a, b) => a * b, 1);
            case 'max':
                return Math.max(...numbers);
            case 'min':
                return Math.min(...numbers);
            default:
                throw new Error('未知操作: ' + operation);
        }
    }

    function sortArray(data) {
        return data.slice().sort((a, b) => a - b);
    }

    function searchData(data) {
        const { array, target } = data;
        return array.indexOf(target);
    }
`;

// 使用示例
const workerManager = new WorkerManager();

// 创建 Worker 池
const workerPool = workerManager.createWorkerPool(workerScript, 2);

// 测试 Worker 执行
async function testWorkerExecution() {
    console.log("测试 Worker 执行...");

    // 计算任务
    const result1 = await workerPool.execute('calculate', {
        operation: 'sum',
        numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    });

    console.log("计算结果:", result1);

    // 排序任务
    const result2 = await workerPool.execute('sort', [5, 2, 9, 1, 7, 6, 3, 8, 4, 10]);
    console.log("排序结果:", result2);

    // 搜索任务
    const result3 = await workerPool.execute('search', {
        array: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        target: 5
    });

    console.log("搜索结果:", result3);

    console.log("Worker 统计:", workerManager.getWorkerStats());
}

testWorkerExecution();
```

## 高级 Worker 模式

### Shared Worker

```javascript
// Shared Worker 实现
class SharedWorkerManager {
    constructor() {
        this.sharedWorkers = new Map();
        this.ports = new Map();
        this.broadcastChannels = new Map();
    }

    // 创建 Shared Worker
    createSharedWorker(script, name) {
        const blob = new Blob([script], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);

        const sharedWorker = new SharedWorker(workerUrl, { name: name });
        const workerId = name || Date.now().toString();

        this.sharedWorkers.set(workerId, {
            worker: sharedWorker,
            url: workerUrl,
            name: name,
            ports: new Set(),
            createdAt: Date.now()
        });

        this.setupSharedWorkerHandlers(workerId, sharedWorker);
        return workerId;
    }

    // 设置 Shared Worker 事件处理器
    setupSharedWorkerHandlers(workerId, sharedWorker) {
        sharedWorker.port.onmessage = (event) => {
            this.handleSharedWorkerMessage(workerId, event);
        };

        sharedWorker.port.onmessageerror = (event) => {
            console.error(`Shared Worker ${workerId} 端口消息错误:`, event);
        };

        sharedWorker.onerror = (error) => {
            this.handleSharedWorkerError(workerId, error);
        };

        sharedWorker.port.start();
    }

    // 处理 Shared Worker 消息
    handleSharedWorkerMessage(workerId, event) {
        const { type, data, from } = event.data;

        switch (type) {
            case 'broadcast':
                this.broadcastToOtherPorts(workerId, from, data);
                break;
            case 'private':
                this.sendToPort(workerId, data.target, data.message);
                break;
            case 'register':
                this.registerPort(workerId, from);
                break;
            case 'unregister':
                this.unregisterPort(workerId, from);
                break;
            default:
                console.log(`Shared Worker ${workerId} 消息:`, event.data);
        }
    }

    // 处理 Shared Worker 错误
    handleSharedWorkerError(workerId, error) {
        console.error(`Shared Worker ${workerId} 错误:`, error);
    }

    // 注册端口
    registerPort(workerId, portId) {
        const workerInfo = this.sharedWorkers.get(workerId);
        if (workerInfo) {
            workerInfo.ports.add(portId);
            console.log(`端口 ${portId} 已注册到 Shared Worker ${workerId}`);
        }
    }

    // 注销端口
    unregisterPort(workerId, portId) {
        const workerInfo = this.sharedWorkers.get(workerId);
        if (workerInfo) {
            workerInfo.ports.delete(portId);
            console.log(`端口 ${portId} 已从 Shared Worker ${workerId} 注销`);
        }
    }

    // 广播消息到其他端口
    broadcastToOtherPorts(workerId, fromPort, data) {
        const workerInfo = this.sharedWorkers.get(workerId);
        if (!workerInfo) return;

        workerInfo.ports.forEach(portId => {
            if (portId !== fromPort) {
                this.sendToPort(workerId, portId, data);
            }
        });
    }

    // 发送消息到指定端口
    sendToPort(workerId, portId, data) {
        const workerInfo = this.sharedWorkers.get(workerId);
        if (!workerInfo) return;

        workerInfo.worker.port.postMessage({
            type: 'forward',
            target: portId,
            data: data
        });
    }

    // 获取 Shared Worker 统计
    getSharedWorkerStats() {
        const stats = {
            totalWorkers: this.sharedWorkers.size,
            workerDetails: []
        };

        for (const [workerId, info] of this.sharedWorkers) {
            stats.workerDetails.push({
                id: workerId,
                name: info.name,
                portCount: info.ports.size,
                uptime: Date.now() - info.createdAt
            });
        }

        return stats;
    }
}

// Shared Worker 脚本模板
const sharedWorkerScript = `
    // Shared Worker 端代码
    const connections = new Set();

    self.onconnect = function(event) {
        const port = event.ports[0];
        const portId = Date.now() + Math.random();

        connections.add({ port, portId });

        port.onmessage = function(event) {
            const { type, data } = event.data;

            switch (type) {
                case 'broadcast':
                    broadcast(portId, data);
                    break;
                case 'private':
                    sendPrivate(data);
                    break;
                case 'register':
                    port.postMessage({
                        type: 'registered',
                        portId: portId
                    });
                    break;
                default:
                    port.postMessage({
                        type: 'echo',
                        data: data,
                        portId: portId
                    });
            }
        };

        port.onmessageerror = function(event) {
            console.error('端口消息错误:', event);
        };

        port.postMessage({
            type: 'connected',
            portId: portId
        });
    };

    function broadcast(fromPortId, data) {
        connections.forEach(({ port, portId }) => {
            if (portId !== fromPortId) {
                port.postMessage({
                    type: 'broadcast',
                    data: data,
                    from: fromPortId
                });
            }
        });
    }

    function sendPrivate(data) {
        const { target, message } = data;

        connections.forEach(({ port, portId }) => {
            if (portId === target) {
                port.postMessage({
                    type: 'private',
                    data: message,
                    from: 'system'
                });
            }
        });
    }

    // 共享状态管理
    const sharedState = {
        counter: 0,
        users: new Set(),
        messages: []
    };

    function updateSharedState(operation, data) {
        switch (operation) {
            case 'increment':
                sharedState.counter++;
                break;
            case 'addUser':
                sharedState.users.add(data);
                break;
            case 'removeUser':
                sharedState.users.delete(data);
                break;
            case 'addMessage':
                sharedState.messages.push({
                    content: data,
                    timestamp: Date.now()
                });
                break;
        }

        // 广播状态变更
        broadcastState();
    }

    function broadcastState() {
        connections.forEach(({ port }) => {
            port.postMessage({
                type: 'stateUpdate',
                state: sharedState
            });
        });
    }
`;

// 使用示例
const sharedWorkerManager = new SharedWorkerManager();

// 创建 Shared Worker
const sharedWorkerId = sharedWorkerManager.createSharedWorker(sharedWorkerScript, 'ChatWorker');

// 模拟多个客户端连接
function simulateSharedWorkerUsage() {
    console.log("模拟 Shared Worker 使用...");

    // 创建连接1
    const port1 = new SharedWorker(URL.createObjectURL(new Blob([`
        const sharedWorker = new SharedWorker('${sharedWorkerManager.sharedWorkers.get(sharedWorkerId).url}');
        sharedWorker.port.onmessage = function(event) {
            console.log('客户端1收到消息:', event.data);
        };
        sharedWorker.port.start();
        sharedWorker.port.postMessage({ type: 'register' });
    `], { type: 'application/javascript' })));

    // 创建连接2
    const port2 = new SharedWorker(URL.createObjectURL(new Blob([`
        const sharedWorker = new SharedWorker('${sharedWorkerManager.sharedWorkers.get(sharedWorkerId).url}');
        sharedWorker.port.onmessage = function(event) {
            console.log('客户端2收到消息:', event.data);
        };
        sharedWorker.port.start();
        sharedWorker.port.postMessage({ type: 'register' });
    `], { type: 'application/javascript' })));

    console.log("Shared Worker 统计:", sharedWorkerManager.getSharedWorkerStats());
}

// simulateSharedWorkerUsage();
```

### Service Worker

```javascript
// Service Worker 实现
class ServiceWorkerManager {
    constructor() {
        this.serviceWorkers = new Map();
        this.registrations = new Map();
        this.cacheManager = new CacheManager();
    }

    // 注册 Service Worker
    async registerServiceWorker(scriptUrl, options = {}) {
        try {
            const registration = await navigator.serviceWorker.register(scriptUrl, options);
            const registrationId = Date.now().toString();

            this.registrations.set(registrationId, {
                registration: registration,
                scriptUrl: scriptUrl,
                options: options,
                registeredAt: Date.now()
            });

            // 设置事件监听器
            this.setupServiceWorkerListeners(registration);

            console.log(`Service Worker 注册成功: ${scriptUrl}`);
            return registrationId;
        } catch (error) {
            console.error(`Service Worker 注册失败: ${scriptUrl}`, error);
            throw error;
        }
    }

    // 设置 Service Worker 事件监听器
    setupServiceWorkerListeners(registration) {
        // 监听更新
        registration.addEventListener('updatefound', () => {
            const installingWorker = registration.installing;
            installingWorker.addEventListener('statechange', () => {
                console.log(`Service Worker 状态变更: ${installingWorker.state}`);
            });
        });

        // 监听控制器变更
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('Service Worker 控制器已变更');
        });

        // 监听消息
        navigator.serviceWorker.addEventListener('message', (event) => {
            this.handleServiceWorkerMessage(event);
        });
    }

    // 处理 Service Worker 消息
    handleServiceWorkerMessage(event) {
        const { type, data } = event.data;

        switch (type) {
            case 'cacheUpdate':
                console.log('缓存已更新:', data);
                break;
            case 'offlineReady':
                console.log('离线功能已就绪');
                break;
            case 'syncComplete':
                console.log('同步完成:', data);
                break;
            default:
                console.log('Service Worker 消息:', event.data);
        }
    }

    // 发送消息到 Service Worker
    async sendMessageToServiceWorker(message) {
        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage(message);
        } else {
            console.warn('没有活动的 Service Worker 控制器');
        }
    }

    // 检查更新
    async checkForUpdates() {
        for (const [_, regInfo] of this.registrations) {
            try {
                await regInfo.registration.update();
                console.log(`检查更新: ${regInfo.scriptUrl}`);
            } catch (error) {
                console.error(`检查更新失败: ${regInfo.scriptUrl}`, error);
            }
        }
    }

    // 获取注册统计
    getRegistrationStats() {
        const stats = {
            totalRegistrations: this.registrations.size,
            registrations: []
        };

        for (const [id, regInfo] of this.registrations) {
            stats.registrations.push({
                id: id,
                scriptUrl: regInfo.scriptUrl,
                active: regInfo.registration.active !== null,
                installing: regInfo.registration.installing !== null,
                waiting: regInfo.registration.waiting !== null,
                uptime: Date.now() - regInfo.registeredAt
            });
        }

        return stats;
    }
}

// 缓存管理器
class CacheManager {
    constructor() {
        this.cacheName = 'v1-cache';
        this.cacheUrls = new Set();
    }

    // 预缓存资源
    async precache(urls) {
        try {
            const cache = await caches.open(this.cacheName);
            await cache.addAll(urls);
            urls.forEach(url => this.cacheUrls.add(url));
            console.log(`预缓存 ${urls.length} 个资源`);
        } catch (error) {
            console.error('预缓存失败:', error);
        }
    }

    // 缓存动态资源
    async cacheDynamic(request, response) {
        if (response.ok) {
            try {
                const cache = await caches.open(this.cacheName);
                await cache.put(request, response);
                console.log(`缓存动态资源: ${request.url}`);
            } catch (error) {
                console.error('缓存动态资源失败:', error);
            }
        }
    }

    // 从缓存获取资源
    async getFromCache(request) {
        try {
            const cache = await caches.open(this.cacheName);
            const response = await cache.match(request);
            return response;
        } catch (error) {
            console.error('从缓存获取资源失败:', error);
            return null;
        }
    }

    // 清理旧缓存
    async cleanup() {
        try {
            const cacheNames = await caches.keys();
            const currentCache = await caches.open(this.cacheName);
            const cachedRequests = await currentCache.keys();

            await Promise.all(
                cacheNames
                    .filter(name => name !== this.cacheName)
                    .map(name => caches.delete(name))
            );

            console.log('清理旧缓存完成');
        } catch (error) {
            console.error('清理缓存失败:', error);
        }
    }
}

// Service Worker 脚本模板
const serviceWorkerScript = `
    // Service Worker 端代码
    const CACHE_NAME = 'v1-cache';
    const API_CACHE_NAME = 'api-cache-v1';
    const STATIC_CACHE_NAME = 'static-cache-v1';

    // 需要缓存的静态资源
    const STATIC_FILES = [
        '/',
        '/index.html',
        '/styles/main.css',
        '/scripts/main.js',
        '/images/logo.png'
    ];

    // API 路由
    const API_ROUTES = [
        '/api/user',
        '/api/posts',
        '/api/comments'
    ];

    // 安装事件
    self.addEventListener('install', (event) => {
        event.waitUntil(
            Promise.all([
                // 缓存静态资源
                caches.open(STATIC_CACHE_NAME)
                    .then(cache => cache.addAll(STATIC_FILES)),

                // 跳过等待阶段
                self.skipWaiting()
            ])
        );
    });

    // 激活事件
    self.addEventListener('activate', (event) => {
        event.waitUntil(
            Promise.all([
                // 清理旧缓存
                caches.keys().then(cacheNames => {
                    return Promise.all(
                        cacheNames
                            .filter(name => name !== STATIC_CACHE_NAME &&
                                        name !== API_CACHE_NAME &&
                                        name !== CACHE_NAME)
                            .map(name => caches.delete(name))
                    );
                }),

                // 立即控制客户端
                self.clients.claim()
            ])
        );
    });

    // 拦截网络请求
    self.addEventListener('fetch', (event) => {
        const url = new URL(event.request.url);

        // 处理静态资源
        if (STATIC_FILES.includes(url.pathname)) {
            event.respondWith(
                caches.match(event.request)
                    .then(response => {
                        return response || fetch(event.request);
                    })
            );
            return;
        }

        // 处理 API 请求
        if (API_ROUTES.some(route => url.pathname.startsWith(route))) {
            event.respondWith(
                handleApiRequest(event.request)
            );
            return;
        }

        // 网络优先策略
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // 缓存成功响应
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // 网络失败时尝试缓存
                    return caches.match(event.request);
                })
        );
    });

    // 处理 API 请求
    async function handleApiRequest(request) {
        try {
            // 尝试网络请求
            const response = await fetch(request);

            if (response.ok) {
                // 缓存 GET 请求的响应
                if (request.method === 'GET') {
                    const cache = await caches.open(API_CACHE_NAME);
                    await cache.put(request, response.clone());
                }
                return response;
            } else {
                throw new Error(\`API 请求失败: \${response.status}\`);
            }
        } catch (error) {
            // 网络失败，尝试缓存
            if (request.method === 'GET') {
                const cached = await caches.match(request);
                if (cached) {
                    return cached;
                }
            }
            throw error;
        }
    }

    // 处理消息
    self.addEventListener('message', (event) => {
        const { type, data } = event.data;

        switch (type) {
            case 'SKIP_WAITING':
                self.skipWaiting();
                break;
            case 'CLAIM_CLIENTS':
                self.clients.claim();
                break;
            case 'CACHE_URLS':
                cacheUrls(data.urls);
                break;
            case 'CLEAR_CACHE':
                clearCache();
                break;
            default:
                console.log('收到未知消息:', event.data);
        }
    });

    // 缓存指定 URL
    async function cacheUrls(urls) {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(urls);

        // 通知主线程
        self.clients.matchAll().then(clients => {
            clients.forEach(client => {
                client.postMessage({
                    type: 'cacheUpdate',
                    data: { urls, timestamp: Date.now() }
                });
            });
        });
    }

    // 清理缓存
    async function clearCache() {
        const cacheNames = await caches.keys();
        await Promise.all(
            cacheNames.map(name => caches.delete(name))
        );

        // 通知主线程
        self.clients.matchAll().then(clients => {
            clients.forEach(client => {
                client.postMessage({
                    type: 'cacheCleared',
                    data: { timestamp: Date.now() }
                });
            });
        });
    }

    // 后台同步
    self.addEventListener('sync', (event) => {
        if (event.tag === 'background-sync') {
            event.waitUntil(
                performBackgroundSync()
            );
        }
    });

    async function performBackgroundSync() {
        try {
            // 模拟后台同步
            const response = await fetch('/api/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    timestamp: Date.now(),
                    data: 'sync data'
                })
            });

            if (response.ok) {
                console.log('后台同步成功');

                // 通知主线程
                self.clients.matchAll().then(clients => {
                    clients.forEach(client => {
                        client.postMessage({
                            type: 'syncComplete',
                            data: { success: true, timestamp: Date.now() }
                        });
                    });
                });
            }
        } catch (error) {
            console.error('后台同步失败:', error);
        }
    }

    // 推送通知
    self.addEventListener('push', (event) => {
        const options = {
            body: '您有新的消息',
            icon: '/images/icon.png',
            badge: '/images/badge.png',
            data: {
                url: '/'
            }
        };

        if (event.data) {
            const data = event.data.json();
            options.body = data.message || options.body;
            options.data = data.url || options.data.url;
        }

        event.waitUntil(
            self.registration.showNotification('新通知', options)
        );
    });

    // 处理通知点击
    self.addEventListener('notificationclick', (event) => {
        event.notification.close();

        event.waitUntil(
            clients.openWindow(event.notification.data.url)
        );
    });
`;

// 使用示例
const serviceWorkerManager = new ServiceWorkerManager();

// 模拟 Service Worker 注册
async function simulateServiceWorkerRegistration() {
    console.log("模拟 Service Worker 注册...");

    try {
        // 创建 Service Worker 脚本
        const blob = new Blob([serviceWorkerScript], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);

        // 注册 Service Worker
        const registrationId = await serviceWorkerManager.registerServiceWorker(workerUrl, {
            scope: '/'
        });

        console.log("Service Worker 注册成功，ID:", registrationId);

        // 发送消息到 Service Worker
        setTimeout(() => {
            serviceWorkerManager.sendMessageToServiceWorker({
                type: 'CACHE_URLS',
                data: {
                    urls: ['/api/data1', '/api/data2']
                }
            });
        }, 1000);

        console.log("Service Worker 统计:", serviceWorkerManager.getRegistrationStats());

    } catch (error) {
        console.error("Service Worker 注册失败:", error);
    }
}

// 注意：Service Worker 需要在 HTTPS 环境下运行
// simulateServiceWorkerRegistration();
```

## Worker 通信模式

### 消息传递优化

```javascript
// 高级消息传递系统
class AdvancedMessageSystem {
    constructor() {
        this.channels = new Map();
        this.subscriptions = new Map();
        this.messageQueue = new Map();
        this.broadcastHistory = [];
        this.maxHistorySize = 1000;
    }

    // 创建消息通道
    createChannel(channelName, options = {}) {
        const channel = {
            name: channelName,
            subscribers: new Set(),
            messageHistory: [],
            maxHistory: options.maxHistory || 100,
            persistent: options.persistent || false,
            created: Date.now()
        };

        this.channels.set(channelName, channel);
        console.log(`创建消息通道: ${channelName}`);

        return {
            subscribe: (callback) => this.subscribe(channelName, callback),
            unsubscribe: (callback) => this.unsubscribe(channelName, callback),
            publish: (message) => this.publish(channelName, message),
            getHistory: () => this.getChannelHistory(channelName),
            getStats: () => this.getChannelStats(channelName)
        };
    }

    // 订阅通道
    subscribe(channelName, callback) {
        const channel = this.channels.get(channelName);
        if (!channel) {
            throw new Error(`通道不存在: ${channelName}`);
        }

        const subscriptionId = Date.now() + Math.random();
        const subscription = {
            id: subscriptionId,
            callback: callback,
            channel: channelName,
            subscribedAt: Date.now()
        };

        if (!this.subscriptions.has(channelName)) {
            this.subscriptions.set(channelName, new Set());
        }

        this.subscriptions.get(channelName).add(subscription);
        channel.subscribers.add(subscriptionId);

        // 发送历史消息给新订阅者
        if (channel.persistent && channel.messageHistory.length > 0) {
            channel.messageHistory.forEach(message => {
                this.deliverMessage(subscription, message);
            });
        }

        console.log(`订阅通道 ${channelName}, ID: ${subscriptionId}`);
        return subscriptionId;
    }

    // 取消订阅
    unsubscribe(channelName, subscriptionId) {
        const channel = this.channels.get(channelName);
        if (!channel) return false;

        const subscriptions = this.subscriptions.get(channelName);
        if (!subscriptions) return false;

        let removed = false;
        for (const subscription of subscriptions) {
            if (subscription.id === subscriptionId) {
                subscriptions.delete(subscription);
                channel.subscribers.delete(subscriptionId);
                removed = true;
                break;
            }
        }

        if (removed) {
            console.log(`取消订阅通道 ${channelName}, ID: ${subscriptionId}`);
        }

        return removed;
    }

    // 发布消息
    publish(channelName, message) {
        const channel = this.channels.get(channelName);
        if (!channel) {
            console.warn(`通道不存在: ${channelName}`);
            return false;
        }

        const messageWrapper = {
            id: Date.now() + Math.random(),
            channel: channelName,
            message: message,
            timestamp: Date.now(),
            publisher: 'system'
        };

        // 添加到历史记录
        if (channel.persistent) {
            channel.messageHistory.push(messageWrapper);
            if (channel.messageHistory.length > channel.maxHistory) {
                channel.messageHistory.shift();
            }
        }

        // 添加到广播历史
        this.broadcastHistory.push(messageWrapper);
        if (this.broadcastHistory.length > this.maxHistorySize) {
            this.broadcastHistory.shift();
        }

        // 发送给所有订阅者
        const subscriptions = this.subscriptions.get(channelName);
        if (subscriptions) {
            for (const subscription of subscriptions) {
                this.deliverMessage(subscription, messageWrapper);
            }
        }

        console.log(`发布消息到通道 ${channelName}:`, message);
        return true;
    }

    // 传递消息
    deliverMessage(subscription, message) {
        try {
            // 异步传递消息，避免阻塞
            setTimeout(() => {
                subscription.callback(message);
            }, 0);
        } catch (error) {
            console.error(`消息传递失败: ${subscription.id}`, error);
        }
    }

    // 获取通道历史
    getChannelHistory(channelName) {
        const channel = this.channels.get(channelName);
        return channel ? channel.messageHistory : [];
    }

    // 获取通道统计
    getChannelStats(channelName) {
        const channel = this.channels.get(channelName);
        if (!channel) return null;

        return {
            name: channelName,
            subscriberCount: channel.subscribers.size,
            messageCount: channel.messageHistory.length,
            created: channel.created,
            uptime: Date.now() - channel.created
        };
    }

    // 跨 Worker 通信
    createCrossWorkerCommunication(workerManager) {
        const messageSystem = this;

        return {
            // 创建 Worker 间通信
            createWorkerChannel: (channelName) => {
                const channel = messageSystem.createChannel(channelName, {
                    persistent: true
                });

                // 为每个 Worker 设置消息处理器
                workerManager.workers.forEach((workerInfo, workerId) => {
                    workerInfo.worker.onmessage = (event) => {
                        if (event.data.type === 'workerMessage') {
                            channel.publish({
                                fromWorker: workerId,
                                data: event.data.message
                            });
                        }
                    };
                });

                return {
                    sendToWorker: (workerId, message) => {
                        const workerInfo = workerManager.workers.get(workerId);
                        if (workerInfo) {
                            workerInfo.worker.postMessage({
                                type: 'workerMessage',
                                message: message
                            });
                        }
                    },
                    broadcastToWorkers: (message) => {
                        workerManager.workers.forEach((workerInfo, workerId) => {
                            workerInfo.worker.postMessage({
                                type: 'workerMessage',
                                message: message
                            });
                        });
                    },
                    channel: channel
                };
            }
        };
    }

    // 消息路由系统
    createMessageRouter() {
        const routes = new Map();
        const middleware = [];

        return {
            addRoute: (pattern, handler) => {
                routes.set(pattern, handler);
            },

            use: (middlewareFn) => {
                middleware.push(middlewareFn);
            },

            route: (message) => {
                return new Promise((resolve, reject) => {
                    const context = {
                        message: message,
                        timestamp: Date.now(),
                        route: null,
                        handled: false
                    };

                    // 执行中间件
                    const executeMiddleware = (index) => {
                        if (index >= middleware.length) {
                            // 执行路由
                            this.executeRoute(context, resolve, reject);
                            return;
                        }

                        const middlewareFn = middleware[index];
                        const result = middlewareFn(context, () => executeMiddleware(index + 1));

                        if (result && typeof result.then === 'function') {
                            result.then(() => executeMiddleware(index + 1))
                                 .catch(reject);
                        }
                    };

                    executeMiddleware(0);
                });
            }
        };
    }

    // 执行路由
    executeRoute(context, resolve, reject) {
        for (const [pattern, handler] of routes) {
            if (this.matchPattern(pattern, context.message)) {
                context.route = pattern;
                context.handled = true;

                try {
                    const result = handler(context.message, context);
                    if (result && typeof result.then === 'function') {
                        result.then(resolve).catch(reject);
                    } else {
                        resolve(result);
                    }
                    return;
                } catch (error) {
                    reject(error);
                    return;
                }
            }
        }

        // 没有匹配的路由
        resolve(null);
    }

    // 模式匹配
    matchPattern(pattern, message) {
        if (typeof pattern === 'string') {
            return pattern === message.type || pattern === message.channel;
        } else if (pattern instanceof RegExp) {
            return pattern.test(message.type) || pattern.test(message.channel);
        } else if (typeof pattern === 'function') {
            return pattern(message);
        }
        return false;
    }

    // 消息持久化
    createPersistentStorage() {
        const storage = new Map();

        return {
            save: (key, data) => {
                try {
                    const serialized = JSON.stringify({
                        data: data,
                        timestamp: Date.now()
                    });
                    storage.set(key, serialized);
                    return true;
                } catch (error) {
                    console.error('保存数据失败:', error);
                    return false;
                }
            },

            load: (key) => {
                try {
                    const serialized = storage.get(key);
                    if (serialized) {
                        const parsed = JSON.parse(serialized);
                        return parsed.data;
                    }
                    return null;
                } catch (error) {
                    console.error('加载数据失败:', error);
                    return null;
                }
            },

            delete: (key) => {
                return storage.delete(key);
            },

            clear: () => {
                storage.clear();
            },

            getAllKeys: () => {
                return Array.from(storage.keys());
            }
        };
    }

    // 获取系统统计
    getSystemStats() {
        const totalSubscribers = Array.from(this.subscriptions.values())
            .reduce((sum, subs) => sum + subs.size, 0);

        const totalMessages = Array.from(this.channels.values())
            .reduce((sum, channel) => sum + channel.messageHistory.length, 0);

        return {
            totalChannels: this.channels.size,
            totalSubscribers: totalSubscribers,
            totalMessages: totalMessages,
            broadcastHistorySize: this.broadcastHistory.length,
            uptime: Date.now() - (this.startTime || Date.now())
        };
    }
}

// 使用示例
const messageSystem = new AdvancedMessageSystem();

// 创建通道
const channel1 = messageSystem.createChannel('updates', { persistent: true });
const channel2 = messageSystem.createChannel('alerts', { persistent: false });

// 订阅通道
const subscription1 = channel1.subscribe((message) => {
    console.log('收到更新消息:', message);
});

const subscription2 = channel2.subscribe((message) => {
    console.log('收到警报消息:', message);
});

// 发布消息
channel1.publish({ type: 'data-update', content: '数据已更新' });
channel2.publish({ type: 'system-alert', content: '系统警告', severity: 'high' });

// 查看统计
console.log("系统统计:", messageSystem.getSystemStats());
console.log("通道1统计:", channel1.getStats());
```

## 性能优化与最佳实践

### Worker 性能监控

```javascript
// Worker 性能监控器
class WorkerPerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.benchmarks = new Map();
        this.alerts = [];
        this.thresholds = {
            responseTime: 1000,    // 1秒
            memoryUsage: 50 * 1024 * 1024, // 50MB
            cpuUsage: 80,         // 80%
            errorRate: 0.05       // 5%
        };
    }

    // 监控 Worker 性能
    monitorWorker(workerId, worker) {
        const metrics = {
            workerId: workerId,
            startTime: Date.now(),
            tasksCompleted: 0,
            tasksFailed: 0,
            totalResponseTime: 0,
            maxResponseTime: 0,
            minResponseTime: Infinity,
            memoryUsage: [],
            cpuUsage: [],
            errors: [],
            lastTaskTime: null
        };

        this.metrics.set(workerId, metrics);

        // 监控消息事件
        const originalOnMessage = worker.onmessage;
        worker.onmessage = (event) => {
            this.handleWorkerMessage(workerId, event);
            if (originalOnMessage) {
                originalOnMessage.call(worker, event);
            }
        };

        // 监控错误事件
        const originalOnError = worker.onerror;
        worker.onerror = (event) => {
            this.handleWorkerError(workerId, event);
            if (originalOnError) {
                originalOnError.call(worker, event);
            }
        };

        // 定期收集性能数据
        const intervalId = setInterval(() => {
            this.collectPerformanceData(workerId);
        }, 5000);

        return {
            stopMonitoring: () => {
                clearInterval(intervalId);
            },
            getMetrics: () => this.getWorkerMetrics(workerId),
            startBenchmark: (name) => this.startBenchmark(workerId, name),
            endBenchmark: (name) => this.endBenchmark(workerId, name)
        };
    }

    // 处理 Worker 消息
    handleWorkerMessage(workerId, event) {
        const metrics = this.metrics.get(workerId);
        if (!metrics) return;

        const now = Date.now();
        const responseTime = now - (metrics.lastTaskTime || now);

        // 更新响应时间统计
        metrics.totalResponseTime += responseTime;
        metrics.maxResponseTime = Math.max(metrics.maxResponseTime, responseTime);
        metrics.minResponseTime = Math.min(metrics.minResponseTime, responseTime);
        metrics.tasksCompleted++;
        metrics.lastTaskTime = now;

        // 检查性能阈值
        this.checkPerformanceThresholds(workerId);
    }

    // 处理 Worker 错误
    handleWorkerError(workerId, event) {
        const metrics = this.metrics.get(workerId);
        if (!metrics) return;

        metrics.errors.push({
            timestamp: Date.now(),
            error: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
        });

        metrics.tasksFailed++;

        // 检查错误率
        this.checkErrorRate(workerId);
    }

    // 收集性能数据
    collectPerformanceData(workerId) {
        const metrics = this.metrics.get(workerId);
        if (!metrics) return;

        // 收集内存使用情况
        if (performance.memory) {
            metrics.memoryUsage.push({
                timestamp: Date.now(),
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            });
        }

        // 模拟 CPU 使用率（实际实现需要更复杂的计算）
        const cpuUsage = Math.random() * 100;
        metrics.cpuUsage.push({
            timestamp: Date.now(),
            usage: cpuUsage
        });

        // 保持数据量在合理范围内
        if (metrics.memoryUsage.length > 100) {
            metrics.memoryUsage = metrics.memoryUsage.slice(-50);
        }
        if (metrics.cpuUsage.length > 100) {
            metrics.cpuUsage = metrics.cpuUsage.slice(-50);
        }
    }

    // 检查性能阈值
    checkPerformanceThresholds(workerId) {
        const metrics = this.metrics.get(workerId);
        if (!metrics) return;

        const avgResponseTime = metrics.totalResponseTime / metrics.tasksCompleted;

        if (avgResponseTime > this.thresholds.responseTime) {
            this.addAlert(workerId, 'responseTime', avgResponseTime);
        }

        // 检查内存使用
        if (metrics.memoryUsage.length > 0) {
            const latestMemory = metrics.memoryUsage[metrics.memoryUsage.length - 1];
            if (latestMemory.used > this.thresholds.memoryUsage) {
                this.addAlert(workerId, 'memoryUsage', latestMemory.used);
            }
        }

        // 检查 CPU 使用率
        if (metrics.cpuUsage.length > 0) {
            const latestCpu = metrics.cpuUsage[metrics.cpuUsage.length - 1];
            if (latestCpu.usage > this.thresholds.cpuUsage) {
                this.addAlert(workerId, 'cpuUsage', latestCpu.usage);
            }
        }
    }

    // 检查错误率
    checkErrorRate(workerId) {
        const metrics = this.metrics.get(workerId);
        if (!metrics) return;

        const totalTasks = metrics.tasksCompleted + metrics.tasksFailed;
        const errorRate = metrics.tasksFailed / totalTasks;

        if (errorRate > this.thresholds.errorRate) {
            this.addAlert(workerId, 'errorRate', errorRate);
        }
    }

    // 添加警报
    addAlert(workerId, type, value) {
        const alert = {
            workerId: workerId,
            type: type,
            value: value,
            timestamp: Date.now(),
            threshold: this.thresholds[type]
        };

        this.alerts.push(alert);

        // 限制警报数量
        if (this.alerts.length > 100) {
            this.alerts = this.alerts.slice(-50);
        }

        console.warn(`性能警报 - Worker ${workerId}: ${type} = ${value}`);
    }

    // 开始基准测试
    startBenchmark(workerId, benchmarkName) {
        const key = `${workerId}_${benchmarkName}`;
        const benchmark = {
            name: benchmarkName,
            startTime: performance.now(),
            measurements: []
        };

        this.benchmarks.set(key, benchmark);
        return key;
    }

    // 结束基准测试
    endBenchmark(workerId, benchmarkName) {
        const key = `${workerId}_${benchmarkName}`;
        const benchmark = this.benchmarks.get(key);
        if (!benchmark) return null;

        benchmark.endTime = performance.now();
        benchmark.duration = benchmark.endTime - benchmark.startTime;

        this.benchmarks.delete(key);
        return benchmark;
    }

    // 获取 Worker 指标
    getWorkerMetrics(workerId) {
        const metrics = this.metrics.get(workerId);
        if (!metrics) return null;

        const uptime = Date.now() - metrics.startTime;
        const avgResponseTime = metrics.tasksCompleted > 0 ?
            metrics.totalResponseTime / metrics.tasksCompleted : 0;
        const errorRate = metrics.tasksCompleted + metrics.tasksFailed > 0 ?
            metrics.tasksFailed / (metrics.tasksCompleted + metrics.tasksFailed) : 0;

        return {
            workerId: workerId,
            uptime: uptime,
            tasksCompleted: metrics.tasksCompleted,
            tasksFailed: metrics.tasksFailed,
            totalTasks: metrics.tasksCompleted + metrics.tasksFailed,
            avgResponseTime: avgResponseTime,
            maxResponseTime: metrics.maxResponseTime,
            minResponseTime: metrics.minResponseTime === Infinity ? 0 : metrics.minResponseTime,
            errorRate: errorRate,
            latestMemoryUsage: metrics.memoryUsage.length > 0 ?
                metrics.memoryUsage[metrics.memoryUsage.length - 1] : null,
            latestCpuUsage: metrics.cpuUsage.length > 0 ?
                metrics.cpuUsage[metrics.cpuUsage.length - 1] : null,
            errorCount: metrics.errors.length
        };
    }

    // 获取系统性能报告
    getPerformanceReport() {
        const report = {
            timestamp: Date.now(),
            workers: [],
            alerts: this.alerts.slice(-10),
            benchmarks: Array.from(this.benchmarks.values())
        };

        for (const [workerId, _] of this.metrics) {
            const metrics = this.getWorkerMetrics(workerId);
            if (metrics) {
                report.workers.push(metrics);
            }
        }

        return report;
    }

    // 性能分析器
    createPerformanceAnalyzer() {
        return {
            analyzeTrends: (workerId, timeframe = 3600000) => {
                const metrics = this.metrics.get(workerId);
                if (!metrics) return null;

                const now = Date.now();
                const startTime = now - timeframe;

                // 分析响应时间趋势
                const responseTimeTrend = this.analyzeResponseTimeTrend(metrics, startTime);

                // 分析内存使用趋势
                const memoryTrend = this.analyzeMemoryTrend(metrics, startTime);

                // 分析错误趋势
                const errorTrend = this.analyzeErrorTrend(metrics, startTime);

                return {
                    workerId: workerId,
                    timeframe: timeframe,
                    responseTimeTrend: responseTimeTrend,
                    memoryTrend: memoryTrend,
                    errorTrend: errorTrend,
                    recommendations: this.generateRecommendations(responseTimeTrend, memoryTrend, errorTrend)
                };
            }
        };
    }

    // 分析响应时间趋势
    analyzeResponseTimeTrend(metrics, startTime) {
        // 简化的趋势分析
        const avgResponseTime = metrics.tasksCompleted > 0 ?
            metrics.totalResponseTime / metrics.tasksCompleted : 0;

        return {
            average: avgResponseTime,
            trend: avgResponseTime > this.thresholds.responseTime ? 'increasing' : 'stable',
            severity: avgResponseTime > this.thresholds.responseTime * 1.5 ? 'high' : 'normal'
        };
    }

    // 分析内存使用趋势
    analyzeMemoryTrend(metrics, startTime) {
        if (metrics.memoryUsage.length === 0) {
            return { trend: 'unknown', severity: 'normal' };
        }

        const recentMemory = metrics.memoryUsage.slice(-10);
        const avgMemory = recentMemory.reduce((sum, m) => sum + m.used, 0) / recentMemory.length;

        return {
            average: avgMemory,
            trend: avgMemory > this.thresholds.memoryUsage * 0.8 ? 'increasing' : 'stable',
            severity: avgMemory > this.thresholds.memoryUsage ? 'high' : 'normal'
        };
    }

    // 分析错误趋势
    analyzeErrorTrend(metrics, startTime) {
        const totalTasks = metrics.tasksCompleted + metrics.tasksFailed;
        const errorRate = totalTasks > 0 ? metrics.tasksFailed / totalTasks : 0;

        return {
            rate: errorRate,
            trend: errorRate > this.thresholds.errorRate ? 'increasing' : 'stable',
            severity: errorRate > this.thresholds.errorRate * 2 ? 'high' : 'normal'
        };
    }

    // 生成优化建议
    generateRecommendations(responseTimeTrend, memoryTrend, errorTrend) {
        const recommendations = [];

        if (responseTimeTrend.severity === 'high') {
            recommendations.push({
                type: 'performance',
                message: '响应时间过长，建议优化任务处理逻辑或增加 Worker 数量'
            });
        }

        if (memoryTrend.severity === 'high') {
            recommendations.push({
                type: 'memory',
                message: '内存使用过高，建议检查内存泄漏或优化数据结构'
            });
        }

        if (errorTrend.severity === 'high') {
            recommendations.push({
                type: 'reliability',
                message: '错误率过高，建议增加错误处理和重试机制'
            });
        }

        return recommendations;
    }
}

// 使用示例
const performanceMonitor = new WorkerPerformanceMonitor();

// 模拟 Worker 监控
function simulateWorkerMonitoring() {
    console.log("模拟 Worker 性能监控...");

    // 创建模拟 Worker
    const worker = new Worker(URL.createObjectURL(new Blob([`
        self.onmessage = function(event) {
            const { type, data } = event.data;

            if (type === 'task') {
                // 模拟任务处理
                setTimeout(() => {
                    self.postMessage({
                        type: 'result',
                        data: { result: data * 2 }
                    });
                }, Math.random() * 2000);
            }
        };
    `], { type: 'application/javascript' })));

    // 开始监控
    const monitoring = performanceMonitor.monitorWorker('worker1', worker);

    // 发送任务
    for (let i = 0; i < 10; i++) {
        worker.postMessage({
            type: 'task',
            data: i
        });
    }

    // 定期查看性能报告
    setInterval(() => {
        const report = performanceMonitor.getPerformanceReport();
        console.log("性能报告:", report.workers[0]);
    }, 3000);
}

// simulateWorkerMonitoring();
```

## 总结

JavaScript 并发编程与 Web Workers 为我们提供了强大的多线程处理能力：

1. **并发基础**：理解 JavaScript 单线程限制和异步并发模式
2. **Web Workers**：创建和管理独立的 Worker 线程
3. **高级 Worker 类型**：Shared Workers 和 Service Workers
4. **消息传递系统**：高效、可靠的 Worker 间通信
5. **性能监控**：实时监控和优化 Worker 性能

通过合理使用这些技术，我们可以构建高性能、可扩展的 JavaScript 应用程序，充分利用多核处理器的优势，提升用户体验。

下一篇博客将探讨 JavaScript 的性能优化与调试技巧。