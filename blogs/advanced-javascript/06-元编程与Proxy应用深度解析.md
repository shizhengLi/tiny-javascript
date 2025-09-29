# JavaScript 元编程与 Proxy 应用深度解析

元编程是编写能够操作程序本身的程序的技术。JavaScript 中的 Proxy 和 Reflect API 为我们提供了强大的元编程能力，使得我们可以拦截和自定义对象的基本操作。本文将深入探讨 JavaScript 元编程的核心概念、Proxy 的高级应用以及实际开发中的最佳实践。

## 元编程基础

### 什么是元编程

```javascript
// 元编程概念演示
class MetaprogrammingDemo {
    constructor() {
        this.examples = new Map();
        this.metaprogrammingPatterns = new Map();
    }

    // 传统编程 vs 元编程对比
    demonstrateTraditionalVsMeta() {
        console.log("=== 传统编程 vs 元编程 ===");

        // 传统编程：直接操作数据
        const traditionalApproach = {
            data: { value: 42 },
            getValue: function() {
                return this.data.value;
            },
            setValue: function(newValue) {
                this.data.value = newValue;
            }
        };

        // 元编程：动态创建和修改对象行为
        const metaApproach = this.createDynamicObject({
            initialValue: 42,
            validators: [
                value => value >= 0,
                value => value <= 100
            ]
        });

        console.log("传统方式:", traditionalApproach.getValue());
        console.log("元编程方式:", metaApproach.value);

        metaApproach.value = 150; // 会触发验证
        traditionalApproach.setValue(150); // 不会触发验证

        console.log("传统方式修改后:", traditionalApproach.getValue());
        console.log("元编程方式修改后:", metaApproach.value);
    }

    // 创建动态对象（元编程示例）
    createDynamicObject(config) {
        const target = {
            _value: config.initialValue,
            _validators: config.validators || [],
            _history: []
        };

        const proxy = new Proxy(target, {
            get: function(target, property) {
                if (property === 'value') {
                    return target._value;
                }

                if (property === 'history') {
                    return [...target._history];
                }

                if (property === 'addValidator') {
                    return function(validator) {
                        target._validators.push(validator);
                    };
                }

                if (property === 'clearHistory') {
                    return function() {
                        target._history = [];
                    };
                }

                return target[property];
            },

            set: function(target, property, value) {
                if (property === 'value') {
                    // 验证新值
                    for (const validator of target._validators) {
                        if (!validator(value)) {
                            console.warn(`验证失败: ${value} 不满足条件`);
                            return false;
                        }
                    }

                    // 记录历史
                    target._history.push({
                        oldValue: target._value,
                        newValue: value,
                        timestamp: Date.now()
                    });

                    target._value = value;
                    return true;
                }

                target[property] = value;
                return true;
            }
        });

        return proxy;
    }

    // 代码生成示例
    demonstrateCodeGeneration() {
        console.log("=== 代码生成示例 ===");

        // 动态生成函数
        const createMultiplier = function(factor) {
            // 使用 Function 构造器动态创建函数
            return new Function('value', `
                return value * ${factor};
            `);
        };

        const double = createMultiplier(2);
        const triple = createMultiplier(3);

        console.log("双倍:", double(5)); // 10
        console.log("三倍:", triple(5)); // 15

        // 动态生成类
        const createDataClass = function(properties) {
            const constructorCode = `
                return class DataClass {
                    constructor(data) {
                        ${properties.map(prop => `
                            this.${prop} = data.${prop};
                        `).join('')}
                    }

                    ${properties.map(prop => `
                        get${prop.charAt(0).toUpperCase() + prop.slice(1)}() {
                            return this.${prop};
                        }

                        set${prop.charAt(0).toUpperCase() + prop.slice(1)}(value) {
                            this.${prop} = value;
                        }
                    `).join('')}

                    toJSON() {
                        return {${properties.map(prop => `${prop}: this.${prop}`).join(', ')}};
                    }
                };
            `;

            return new Function(constructorCode)();
        };

        const UserClass = createDataClass(['name', 'age', 'email']);
        const user = new UserClass({
            name: '张三',
            age: 25,
            email: 'zhangsan@example.com'
        });

        console.log("动态生成的用户类:", user);
        console.log("用户姓名:", user.getName());
        user.setAge(26);
        console.log("更新后的年龄:", user.getAge());
    }

    // 自省（Introspection）示例
    demonstrateIntrospection() {
        console.log("=== 自省示例 ===");

        const obj = {
            name: '测试对象',
            value: 42,
            method: function() {
                return '方法调用';
            }
        };

        // 检查对象属性
        console.log("对象属性:");
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                console.log(`  ${key}: ${typeof obj[key]}`);
            }
        }

        // 获取对象原型链
        console.log("原型链:");
        let proto = Object.getPrototypeOf(obj);
        while (proto) {
            console.log(`  ${proto.constructor.name}`);
            proto = Object.getPrototypeOf(proto);
        }

        // 检查属性描述符
        console.log("属性描述符:");
        const descriptor = Object.getOwnPropertyDescriptor(obj, 'name');
        console.log("  name:", descriptor);

        // 使用 Reflect API
        console.log("Reflect API:");
        console.log("  has own property 'name':", Reflect.has(obj, 'name'));
        console.log("  get own property descriptor:", Reflect.getOwnPropertyDescriptor(obj, 'name'));
        console.log("  own keys:", Reflect.ownKeys(obj));
    }

    // 运行时修改对象
    demonstrateRuntimeModification() {
        console.log("=== 运行时修改示例 ===");

        class Animal {
            constructor(name) {
                this.name = name;
            }

            speak() {
                return `${this.name} 发出声音`;
            }
        }

        // 运行时添加方法
        Animal.prototype.run = function() {
            return `${this.name} 在奔跑`;
        };

        // 运行时修改现有方法
        const originalSpeak = Animal.prototype.speak;
        Animal.prototype.speak = function() {
            const result = originalSpeak.call(this);
            return result + " (增强版)";
        };

        const dog = new Animal('小狗');
        console.log(dog.speak());
        console.log(dog.run());

        // 使用 Proxy 拦截方法调用
        const loggingProxy = new Proxy(dog, {
            get: function(target, property) {
                const value = target[property];
                if (typeof value === 'function') {
                    return function(...args) {
                        console.log(`调用方法: ${property}, 参数: ${args}`);
                        return value.apply(target, args);
                    };
                }
                return value;
            }
        });

        console.log(loggingProxy.speak());
    }
}

// 使用示例
const metaDemo = new MetaprogrammingDemo();
metaDemo.demonstrateTraditionalVsMeta();
metaDemo.demonstrateCodeGeneration();
metaDemo.demonstrateIntrospection();
metaDemo.demonstrateRuntimeModification();
```

## Proxy 深入解析

### Proxy 基本概念

```javascript
// Proxy 深度解析
class ProxyDeepDive {
    constructor() {
        this.proxyExamples = new Map();
        this.trapHandlers = new Map();
        this.performanceMetrics = new Map();
    }

    // 创建完整的 Proxy 陷阱处理器
    createCompleteProxyHandler() {
        return {
            // 基础操作陷阱
            get: function(target, property, receiver) {
                console.log(`[GET] ${property}`);
                const value = Reflect.get(target, property, receiver);
                return typeof value === 'function' ? value.bind(target) : value;
            },

            set: function(target, property, value, receiver) {
                console.log(`[SET] ${property} = ${value}`);
                return Reflect.set(target, property, value, receiver);
            },

            has: function(target, property) {
                console.log(`[HAS] ${property}`);
                return Reflect.has(target, property);
            },

            deleteProperty: function(target, property) {
                console.log(`[DELETE] ${property}`);
                return Reflect.deleteProperty(target, property);
            },

            // 属性描述符陷阱
            getOwnPropertyDescriptor: function(target, property) {
                console.log(`[GET OWN PROPERTY DESCRIPTOR] ${property}`);
                return Reflect.getOwnPropertyDescriptor(target, property);
            },

            defineProperty: function(target, property, descriptor) {
                console.log(`[DEFINE PROPERTY] ${property}`);
                return Reflect.defineProperty(target, property, descriptor);
            },

            // 原型陷阱
            getPrototypeOf: function(target) {
                console.log('[GET PROTOTYPE OF]');
                return Reflect.getPrototypeOf(target);
            },

            setPrototypeOf: function(target, prototype) {
                console.log('[SET PROTOTYPE OF]');
                return Reflect.setPrototypeOf(target, prototype);
            },

            // 可扩展性陷阱
            isExtensible: function(target) {
                console.log('[IS EXTENSIBLE]');
                return Reflect.isExtensible(target);
            },

            preventExtensions: function(target) {
                console.log('[PREVENT EXTENSIONS]');
                return Reflect.preventExtensions(target);
            },

            // 枚举陷阱
            ownKeys: function(target) {
                console.log('[OWN KEYS]');
                return Reflect.ownKeys(target);
            },

            // 函数调用陷阱
            apply: function(target, thisArg, argumentsList) {
                console.log('[APPLY]', { target: target.name, thisArg, argumentsList });
                return Reflect.apply(target, thisArg, argumentsList);
            },

            // 构造函数陷阱
            construct: function(target, argumentsList, newTarget) {
                console.log('[CONSTRUCT]', { target: target.name, argumentsList });
                return Reflect.construct(target, argumentsList, newTarget);
            }
        };
    }

    // 创建可观察对象
    createObservableObject(target, onChange) {
        const handlers = {
            get: function(target, property, receiver) {
                const value = Reflect.get(target, property, receiver);

                // 如果是对象，递归创建可观察对象
                if (typeof value === 'object' && value !== null && !value._isObservable) {
                    const observableValue = createObservableObject(value, onChange);
                    Reflect.set(target, property, observableValue);
                    return observableValue;
                }

                return value;
            },

            set: function(target, property, value, receiver) {
                const oldValue = Reflect.get(target, property, receiver);
                const result = Reflect.set(target, property, value, receiver);

                if (result && oldValue !== value) {
                    onChange({
                        type: 'set',
                        target: target,
                        property: property,
                        oldValue: oldValue,
                        newValue: value,
                        timestamp: Date.now()
                    });
                }

                return result;
            },

            deleteProperty: function(target, property) {
                const oldValue = Reflect.get(target, property);
                const result = Reflect.deleteProperty(target, property);

                if (result) {
                    onChange({
                        type: 'delete',
                        target: target,
                        property: property,
                        oldValue: oldValue,
                        timestamp: Date.now()
                    });
                }

                return result;
            }
        };

        // 标记对象为可观察
        target._isObservable = true;

        return new Proxy(target, handlers);
    }

    // 创建验证代理
    createValidatedProxy(target, schema) {
        const validators = {
            type: (value, expected) => typeof value === expected,
            min: (value, expected) => value >= expected,
            max: (value, expected) => value <= expected,
            pattern: (value, expected) => expected.test(value),
            custom: (value, validator) => validator(value)
        };

        return new Proxy(target, {
            set: function(target, property, value, receiver) {
                const propertySchema = schema[property];

                if (propertySchema) {
                    // 验证属性值
                    for (const [rule, expected] of Object.entries(propertySchema)) {
                        if (rule === 'required') continue;

                        const validator = validators[rule];
                        if (!validator || !validator(value, expected)) {
                            throw new Error(`验证失败: ${property}.${rule} = ${value}, 期望: ${expected}`);
                        }
                    }
                }

                return Reflect.set(target, property, value, receiver);
            },

            defineProperty: function(target, property, descriptor) {
                const propertySchema = schema[property];

                if (propertySchema) {
                    // 验证属性描述符
                    if (descriptor.value !== undefined) {
                        for (const [rule, expected] of Object.entries(propertySchema)) {
                            if (rule === 'required') continue;

                            const validator = validators[rule];
                            if (!validator || !validator(descriptor.value, expected)) {
                                throw new Error(`验证失败: ${property}.${rule} = ${descriptor.value}, 期望: ${expected}`);
                            }
                        }
                    }
                }

                return Reflect.defineProperty(target, property, descriptor);
            }
        });
    }

    // 创建懒加载代理
    createLazyProxy(factory, options = {}) {
        let instance = null;
        let isInitialized = false;
        const initializationPromises = new Set();

        const proxy = new Proxy({}, {
            get: function(target, property, receiver) {
                if (!isInitialized) {
                    if (!instance) {
                        instance = factory();
                        isInitialized = true;
                    }
                }

                const value = Reflect.get(instance, property, receiver);

                // 如果是方法，绑定正确的 this
                if (typeof value === 'function') {
                    return value.bind(instance);
                }

                return value;
            },

            set: function(target, property, value, receiver) {
                if (!isInitialized) {
                    if (!instance) {
                        instance = factory();
                        isInitialized = true;
                    }
                }

                return Reflect.set(instance, property, value, receiver);
            },

            has: function(target, property) {
                if (!isInitialized) {
                    if (!instance) {
                        instance = factory();
                        isInitialized = true;
                    }
                }

                return Reflect.has(instance, property);
            },

            ownKeys: function(target) {
                if (!isInitialized) {
                    if (!instance) {
                        instance = factory();
                        isInitialized = true;
                    }
                }

                return Reflect.ownKeys(instance);
            },

            getOwnPropertyDescriptor: function(target, property) {
                if (!isInitialized) {
                    if (!instance) {
                        instance = factory();
                        isInitialized = true;
                    }
                }

                return Reflect.getOwnPropertyDescriptor(instance, property);
            },

            apply: function(target, thisArg, argumentsList) {
                if (!isInitialized) {
                    if (!instance) {
                        instance = factory();
                        isInitialized = true;
                    }
                }

                return Reflect.apply(instance, thisArg, argumentsList);
            }
        });

        // 添加额外方法
        proxy.isInitialized = () => isInitialized;
        proxy.getInstance = () => instance;
        proxy.reset = () => {
            instance = null;
            isInitialized = false;
        };

        return proxy;
    }

    // 创建缓存代理
    createCachedProxy(target, options = {}) {
        const cache = new Map();
        const maxSize = options.maxSize || 1000;
        const ttl = options.ttl || 60000; // 1分钟

        const getCachedResult = function(key) {
            const cached = cache.get(key);
            if (!cached) return null;

            if (Date.now() - cached.timestamp > ttl) {
                cache.delete(key);
                return null;
            }

            return cached.result;
        };

        const setCachedResult = function(key, result) {
            // 检查缓存大小
            if (cache.size >= maxSize) {
                // 简单的 LRU 策略
                const firstKey = cache.keys().next().value;
                cache.delete(firstKey);
            }

            cache.set(key, {
                result: result,
                timestamp: Date.now()
            });
        };

        return new Proxy(target, {
            get: function(target, property, receiver) {
                if (property === 'clearCache') {
                    return function() {
                        cache.clear();
                    };
                }

                if (property === 'getCacheStats') {
                    return function() {
                        return {
                            size: cache.size,
                            maxSize: maxSize,
                            ttl: ttl,
                            keys: Array.from(cache.keys())
                        };
                    };
                }

                // 为方法调用创建缓存
                if (typeof target[property] === 'function') {
                    return function(...args) {
                        const cacheKey = `${property}_${JSON.stringify(args)}`;
                        const cachedResult = getCachedResult(cacheKey);

                        if (cachedResult !== null) {
                            console.log(`缓存命中: ${property}`);
                            return cachedResult;
                        }

                        console.log(`缓存未命中: ${property}`);
                        const result = target[property].apply(target, args);
                        setCachedResult(cacheKey, result);
                        return result;
                    };
                }

                return Reflect.get(target, property, receiver);
            }
        });
    }

    // 创建性能监控代理
    createMonitoredProxy(target, options = {}) {
        const metrics = {
            calls: new Map(),
            errors: new Map(),
            timings: new Map()
        };

        return new Proxy(target, {
            get: function(target, property, receiver) {
                if (property === 'getMetrics') {
                    return function() {
                        return {
                            calls: Array.from(metrics.calls.entries()),
                            errors: Array.from(metrics.errors.entries()),
                            timings: Array.from(metrics.timings.entries())
                        };
                    };
                }

                if (property === 'clearMetrics') {
                    return function() {
                        metrics.calls.clear();
                        metrics.errors.clear();
                        metrics.timings.clear();
                    };
                }

                if (typeof target[property] === 'function') {
                    return function(...args) {
                        const startTime = performance.now();
                        const key = `${property}_${JSON.stringify(args)}`;

                        // 记录调用
                        metrics.calls.set(key, (metrics.calls.get(key) || 0) + 1);

                        try {
                            const result = target[property].apply(target, args);

                            // 记录成功
                            const endTime = performance.now();
                            const duration = endTime - startTime;

                            if (!metrics.timings.has(property)) {
                                metrics.timings.set(property, []);
                            }
                            metrics.timings.get(property).push(duration);

                            if (options.logCalls) {
                                console.log(`调用 ${property}(${args.join(', ')}) = ${result}, 耗时: ${duration.toFixed(2)}ms`);
                            }

                            return result;
                        } catch (error) {
                            // 记录错误
                            metrics.errors.set(key, (metrics.errors.get(key) || 0) + 1);

                            if (options.logErrors) {
                                console.error(`调用 ${property} 失败:`, error);
                            }

                            throw error;
                        }
                    };
                }

                return Reflect.get(target, property, receiver);
            }
        });
    }
}

// 使用示例
const proxyDeepDive = new ProxyDeepDive();

// 完整代理示例
const completeHandler = proxyDeepDive.createCompleteProxyHandler();
const targetObject = {
    name: '测试对象',
    value: 42,
    method: function() {
        return this.name + ': ' + this.value;
    }
};

const completeProxy = new Proxy(targetObject, completeHandler);
console.log(completeProxy.name);
completeProxy.newProperty = '新属性';
console.log(completeProxy.method());

// 可观察对象示例
const observableObj = proxyDeepDive.createObservableObject(
    { user: { name: '张三', age: 25 } },
    (change) => {
        console.log('对象发生变化:', change);
    }
);

observableObj.user.name = '李四';
observableObj.user.age = 26;

// 验证代理示例
const schema = {
    name: { type: 'string', required: true },
    age: { type: 'number', min: 0, max: 120 },
    email: { type: 'string', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
};

const validatedObj = proxyDeepDive.createValidatedProxy({}, schema);

try {
    validatedObj.name = '王五';
    validatedObj.age = 30;
    validatedObj.email = 'wangwu@example.com';
    console.log('验证通过:', validatedObj);
} catch (error) {
    console.error('验证失败:', error.message);
}

// 懒加载代理示例
const lazyObj = proxyDeepDive.createLazyProxy(() => {
    console.log('创建复杂对象...');
    return {
        data: new Array(1000).fill(0).map((_, i) => i),
        processData: function() {
            return this.data.reduce((sum, val) => sum + val, 0);
        }
    };
});

console.log('懒加载对象已创建，但未初始化');
console.log('访问属性:', lazyObj.data.length);
console.log('处理数据:', lazyObj.processData());

// 缓存代理示例
const expensiveOperations = {
    fibonacci: function(n) {
        if (n <= 1) return n;
        return expensiveOperations.fibonacci(n - 1) + expensiveOperations.fibonacci(n - 2);
    },

    factorial: function(n) {
        if (n <= 1) return 1;
        return n * expensiveOperations.factorial(n - 1);
    }
};

const cachedOps = proxyDeepDive.createCachedProxy(expensiveOperations);

console.log('第一次计算 fib(30):', cachedOps.fibonacci(30));
console.log('第二次计算 fib(30):', cachedOps.fibonacci(30));
console.log('缓存统计:', cachedOps.getCacheStats());

// 性能监控代理示例
const monitoredOps = proxyDeepDive.createMonitoredProxy({
    quickOperation: function() {
        return Math.random();
    },

    slowOperation: function() {
        let sum = 0;
        for (let i = 0; i < 1000000; i++) {
            sum += Math.sqrt(i);
        }
        return sum;
    }
}, { logCalls: true, logErrors: true });

monitoredOps.quickOperation();
monitoredOps.slowOperation();
console.log('性能指标:', monitoredOps.getMetrics());
```

## 高级 Proxy 模式

### 组合代理模式

```javascript
// 高级 Proxy 模式
class AdvancedProxyPatterns {
    constructor() {
        this.proxyFactories = new Map();
        this.compositeProxies = new Map();
        this.patternExamples = new Map();
    }

    // 创建多层代理（代理链）
    createProxyChain(target, ...handlers) {
        let proxy = target;

        // 反向应用处理器（从右到左）
        for (let i = handlers.length - 1; i >= 0; i--) {
            proxy = new Proxy(proxy, handlers[i]);
        }

        return proxy;
    }

    // 创建组合代理
    createCompositeProxy(target, features) {
        const handlers = [];

        // 根据功能需求添加处理器
        if (features.logging) {
            handlers.push(this.createLoggingHandler());
        }

        if (features.validation) {
            handlers.push(this.createValidationHandler(features.validation));
        }

        if (features.caching) {
            handlers.push(this.createCachingHandler(features.caching));
        }

        if (features.monitoring) {
            handlers.push(this.createMonitoringHandler());
        }

        if (features.immutability) {
            handlers.push(this.createImmutableHandler());
        }

        return this.createProxyChain(target, ...handlers);
    }

    // 创建日志处理器
    createLoggingHandler(options = {}) {
        const logLevel = options.level || 'info';
        const prefix = options.prefix || '[Proxy]';

        return {
            get: function(target, property, receiver) {
                const value = Reflect.get(target, property, receiver);
                console.log(`${prefix} [GET] ${property} = ${value}`);
                return typeof value === 'function' ? value.bind(target) : value;
            },

            set: function(target, property, value, receiver) {
                console.log(`${prefix} [SET] ${property} = ${value}`);
                return Reflect.set(target, property, value, receiver);
            },

            deleteProperty: function(target, property) {
                console.log(`${prefix} [DELETE] ${property}`);
                return Reflect.deleteProperty(target, property);
            },

            apply: function(target, thisArg, argumentsList) {
                console.log(`${prefix} [APPLY] ${target.name || 'anonymous'}(${argumentsList.join(', ')})`);
                return Reflect.apply(target, thisArg, argumentsList);
            }
        };
    }

    // 创建验证处理器
    createValidationHandler(schema) {
        const validators = {
            type: (value, expected) => typeof value === expected,
            instance: (value, expected) => value instanceof expected,
            min: (value, expected) => value >= expected,
            max: (value, expected) => value <= expected,
            pattern: (value, expected) => expected.test(value),
            enum: (value, expected) => expected.includes(value),
            custom: (value, validator) => validator(value)
        };

        return {
            set: function(target, property, value, receiver) {
                const propertySchema = schema && schema[property];

                if (propertySchema) {
                    for (const [rule, expected] of Object.entries(propertySchema)) {
                        const validator = validators[rule];
                        if (!validator || !validator(value, expected)) {
                            throw new Error(`验证失败: ${property}.${rule} = ${value}, 期望: ${expected}`);
                        }
                    }
                }

                return Reflect.set(target, property, value, receiver);
            }
        };
    }

    // 创建缓存处理器
    createCachingHandler(options = {}) {
        const cache = new Map();
        const maxSize = options.maxSize || 1000;
        const ttl = options.ttl || 60000;

        const generateKey = function(property, args) {
            return `${property}_${JSON.stringify(args)}`;
        };

        const isExpired = function(cached) {
            return Date.now() - cached.timestamp > ttl;
        };

        const cleanupCache = function() {
            if (cache.size >= maxSize) {
                const firstKey = cache.keys().next().value;
                cache.delete(firstKey);
            }
        };

        return {
            get: function(target, property, receiver) {
                if (property === 'clearCache') {
                    return function() {
                        cache.clear();
                    };
                }

                if (property === 'getCacheInfo') {
                    return function() {
                        return {
                            size: cache.size,
                            maxSize: maxSize,
                            ttl: ttl,
                            keys: Array.from(cache.keys())
                        };
                    };
                }

                const value = Reflect.get(target, property, receiver);

                if (typeof value === 'function') {
                    return function(...args) {
                        const key = generateKey(property, args);
                        const cached = cache.get(key);

                        if (cached && !isExpired(cached)) {
                            console.log(`缓存命中: ${property}`);
                            return cached.result;
                        }

                        console.log(`缓存未命中: ${property}`);
                        const result = value.apply(target, args);

                        cleanupCache();
                        cache.set(key, {
                            result: result,
                            timestamp: Date.now()
                        });

                        return result;
                    };
                }

                return value;
            }
        };
    }

    // 创建监控处理器
    createMonitoringHandler() {
        const metrics = {
            calls: new Map(),
            errors: new Map(),
            timings: new Map()
        };

        return {
            get: function(target, property, receiver) {
                if (property === 'getMetrics') {
                    return function() {
                        return {
                            calls: Array.from(metrics.calls.entries()),
                            errors: Array.from(metrics.errors.entries()),
                            timings: this.calculateTimingStats()
                        };
                    }.bind(this);
                }

                if (property === 'clearMetrics') {
                    return function() {
                        metrics.calls.clear();
                        metrics.errors.clear();
                        metrics.timings.clear();
                    };
                }

                const value = Reflect.get(target, property, receiver);

                if (typeof value === 'function') {
                    return function(...args) {
                        const startTime = performance.now();
                        const key = `${property}_${JSON.stringify(args)}`;

                        metrics.calls.set(key, (metrics.calls.get(key) || 0) + 1);

                        try {
                            const result = value.apply(target, args);

                            const endTime = performance.now();
                            const duration = endTime - startTime;

                            if (!metrics.timings.has(property)) {
                                metrics.timings.set(property, []);
                            }
                            metrics.timings.get(property).push(duration);

                            return result;
                        } catch (error) {
                            metrics.errors.set(key, (metrics.errors.get(key) || 0) + 1);
                            throw error;
                        }
                    };
                }

                return value;
            },

            calculateTimingStats: function() {
                const stats = {};

                for (const [method, timings] of metrics.timings) {
                    const sorted = timings.slice().sort((a, b) => a - b);
                    stats[method] = {
                        count: timings.length,
                        min: sorted[0],
                        max: sorted[sorted.length - 1],
                        avg: timings.reduce((a, b) => a + b, 0) / timings.length,
                        p95: sorted[Math.floor(sorted.length * 0.95)],
                        p99: sorted[Math.floor(sorted.length * 0.99)]
                    };
                }

                return stats;
            }.bind(this)
        };
    }

    // 创建不可变处理器
    createImmutableHandler() {
        return {
            set: function(target, property, value, receiver) {
                throw new Error(`不可变对象: 不能设置属性 ${property}`);
            },

            deleteProperty: function(target, property) {
                throw new Error(`不可变对象: 不能删除属性 ${property}`);
            },

            defineProperty: function(target, property, descriptor) {
                throw new Error(`不可变对象: 不能定义属性 ${property}`);
            },

            setPrototypeOf: function(target, prototype) {
                throw new Error(`不可变对象: 不能设置原型`);
            },

            preventExtensions: function(target) {
                return Reflect.preventExtensions(target);
            }
        };
    }

    // 创建状态管理代理
    createStateManager(initialState) {
        let state = { ...initialState };
        const listeners = new Set();
        const history = [];
        const maxHistory = 50;

        const notifyListeners = (action, payload) => {
            listeners.forEach(listener => {
                try {
                    listener({ state, action, payload });
                } catch (error) {
                    console.error('状态更新监听器错误:', error);
                }
            });
        };

        const addToHistory = (action, payload) => {
            history.push({
                timestamp: Date.now(),
                action: action,
                payload: payload,
                state: { ...state }
            });

            if (history.length > maxHistory) {
                history.shift();
            }
        };

        const reducer = (action, payload) => {
            // 简化的 reducer
            switch (action) {
                case 'SET':
                    return { ...state, ...payload };
                case 'MERGE':
                    return { ...state, ...payload };
                case 'DELETE':
                    const newState = { ...state };
                    delete newState[payload];
                    return newState;
                default:
                    return state;
            }
        };

        return new Proxy({}, {
            get: function(target, property) {
                switch (property) {
                    case 'getState':
                        return () => ({ ...state });

                    case 'dispatch':
                        return (action, payload) => {
                            const oldState = { ...state };
                            state = reducer(action, payload);
                            addToHistory(action, payload);
                            notifyListeners(action, payload);
                        };

                    case 'subscribe':
                        return (listener) => {
                            listeners.add(listener);
                            return () => listeners.delete(listener);
                        };

                    case 'getHistory':
                        return () => [...history];

                    case 'undo':
                        return () => {
                            if (history.length > 1) {
                                history.pop(); // 移除当前状态
                                const previous = history[history.length - 1];
                                state = { ...previous.state };
                                notifyListeners('UNDO', null);
                            }
                        };

                    case 'redo':
                        return () => {
                            // 简化实现，实际需要更复杂的状态管理
                            console.log('重做功能需要更复杂的历史管理');
                        };

                    case 'clearHistory':
                        return () => {
                            history.length = 0;
                        };

                    default:
                        return state[property];
                }
            },

            set: function(target, property, value) {
                throw new Error('请使用 dispatch 方法修改状态');
            }
        });
    }

    // 创建虚拟对象代理
    createVirtualObject(schema) {
        const virtualMethods = new Map();

        const createVirtualMethod = (methodName, methodSchema) => {
            return function(...args) {
                console.log(`调用虚拟方法: ${methodName}`, args);

                // 根据方法类型返回模拟数据
                switch (methodSchema.type) {
                    case 'number':
                        return Math.random() * (methodSchema.max || 100);
                    case 'string':
                        return `模拟 ${methodName} 结果`;
                    case 'array':
                        return Array.from({ length: methodSchema.length || 5 }, (_, i) => ({
                            id: i,
                            value: Math.random()
                        }));
                    case 'object':
                        return {
                            id: Date.now(),
                            timestamp: Date.now(),
                            data: '模拟数据'
                        };
                    case 'async':
                        return new Promise(resolve => {
                            setTimeout(() => {
                                resolve({
                                    result: `异步 ${methodName} 完成`,
                                    timestamp: Date.now()
                                });
                            }, methodSchema.delay || 1000);
                        });
                    default:
                        return null;
                }
            };
        };

        // 创建虚拟对象
        const virtualObject = {};

        for (const [methodName, methodSchema] of Object.entries(schema)) {
            virtualObject[methodName] = createVirtualMethod(methodName, methodSchema);
        }

        return new Proxy(virtualObject, {
            get: function(target, property) {
                if (property in target) {
                    return target[property];
                }

                // 动态创建虚拟方法
                return function(...args) {
                    console.log(`调用动态虚拟方法: ${property}`, args);
                    return { method: property, args, timestamp: Date.now() };
                };
            }
        });
    }

    // 创建装饰器代理
    createDecoratorProxy(target, decorators) {
        const handler = {};

        // 为每个陷阱创建装饰器
        const traps = ['get', 'set', 'apply', 'construct', 'has', 'deleteProperty'];

        traps.forEach(trap => {
            handler[trap] = function(target, ...args) {
                let result = Reflect[trap](target, ...args);

                // 应用装饰器
                for (const decorator of decorators) {
                    if (typeof decorator[trap] === 'function') {
                        result = decorator[trap](result, ...args);
                    }
                }

                return result;
            };
        });

        return new Proxy(target, handler);
    }
}

// 使用示例
const advancedPatterns = new AdvancedProxyPatterns();

// 组合代理示例
const features = {
    logging: true,
    validation: {
        name: { type: 'string', required: true },
        age: { type: 'number', min: 0, max: 120 }
    },
    caching: { maxSize: 100, ttl: 30000 },
    monitoring: true,
    immutability: false
};

const targetObject = {
    name: '测试',
    age: 25,
    calculate: function(x, y) {
        return x + y;
    }
};

const compositeProxy = advancedPatterns.createCompositeProxy(targetObject, features);

console.log('组合代理测试:');
compositeProxy.name = '新名称';
console.log(compositeProxy.calculate(10, 20));
console.log(compositeProxy.calculate(10, 20)); // 缓存命中

// 状态管理示例
const stateManager = advancedPatterns.createStateManager({
    user: null,
    loading: false,
    error: null
});

const unsubscribe = stateManager.subscribe(({ state, action }) => {
    console.log('状态更新:', { state, action });
});

stateManager.dispatch('SET', { user: { name: '张三' } });
stateManager.dispatch('SET', { loading: true });

console.log('当前状态:', stateManager.getState());

// 虚拟对象示例
const virtualSchema = {
    getUser: { type: 'object' },
    getUsers: { type: 'array', length: 10 },
    calculateTotal: { type: 'number' },
    fetchData: { type: 'async', delay: 2000 }
};

const virtualAPI = advancedPatterns.createVirtualObject(virtualSchema);

console.log('虚拟API测试:');
virtualAPI.getUser().then(console.log);
virtualAPI.getUsers().forEach(user => console.log(user));

// 装饰器代理示例
const decorators = [
    {
        get: function(result, target, property) {
            console.log(`装饰器 [GET] ${property}`);
            return result;
        }
    },
    {
        apply: function(result, target, thisArg, args) {
            console.log(`装饰器 [APPLY] 调用前`);
            return result;
        }
    }
];

const decoratedTarget = {
    method: function(x) {
        return x * 2;
    }
};

const decoratedProxy = advancedPatterns.createDecoratorProxy(decoratedTarget, decorators);
console.log('装饰器结果:', decoratedProxy.method(5));
```

## 实际应用场景

### 数据绑定和响应式系统

```javascript
// 响应式数据绑定系统
class ReactiveDataBinding {
    constructor() {
        this.reactiveObjects = new Map();
        this.dependencyGraph = new Map();
        this.updatesQueue = new Set();
        this.isBatching = false;
    }

    // 创建响应式对象
    createReactiveObject(data, options = {}) {
        const id = Date.now().toString();
        const dependencies = new Map();
        const watchers = new Set();

        const reactive = new Proxy(data, {
            get: function(target, property, receiver) {
                const value = Reflect.get(target, property, receiver);

                // 记录依赖关系
                if (DependencyTracker.current) {
                    if (!dependencies.has(DependencyTracker.current)) {
                        dependencies.set(DependencyTracker.current, new Set());
                    }
                    dependencies.get(DependencyTracker.current).add(property);
                }

                // 如果是对象，递归创建响应式对象
                if (typeof value === 'object' && value !== null && !value._isReactive) {
                    const reactiveValue = createReactiveObject.call(this, value, options);
                    Reflect.set(target, property, reactiveValue);
                    return reactiveValue;
                }

                return value;
            },

            set: function(target, property, value, receiver) {
                const oldValue = Reflect.get(target, property, receiver);
                const result = Reflect.set(target, property, value, receiver);

                if (result && oldValue !== value) {
                    // 标记需要更新
                    scheduleUpdate(id, property, oldValue, value);
                }

                return result;
            }
        });

        // 标记为响应式对象
        reactive._isReactive = true;
        reactive._id = id;

        // 存储依赖关系
        this.dependencyGraph.set(id, dependencies);
        this.reactiveObjects.set(id, { reactive, dependencies, watchers });

        return reactive;
    }

    // 计算属性
    computed(getter, options = {}) {
        const computed = {
            _value: undefined,
            _dirty: true,
            _dependencies: new Set(),
            _getter: getter,
            _watchers: new Set()
        };

        const evaluate = () => {
            // 跟踪依赖
            DependencyTracker.current = computed;
            computed._dependencies.clear();

            try {
                computed._value = computed._getter();
                computed._dirty = false;
            } catch (error) {
                console.error('计算属性计算失败:', error);
            } finally {
                DependencyTracker.current = null;
            }
        };

        const handler = {
            get: function(target, property) {
                if (property === 'value') {
                    if (target._dirty) {
                        evaluate();
                    }
                    return target._value;
                }

                if (property === 'invalidate') {
                    return function() {
                        target._dirty = true;
                        target._watchers.forEach(watcher => watcher());
                    };
                }

                return target[property];
            }
        };

        return new Proxy(computed, handler);
    }

    // 监听器
    watch(reactive, callback, options = {}) {
        const watcher = {
            callback: callback,
            options: options,
            immediate: options.immediate || false
        };

        const id = reactive._id;
        if (id && this.reactiveObjects.has(id)) {
            this.reactiveObjects.get(id).watchers.add(watcher);

            if (watcher.immediate) {
                callback(reactive);
            }
        }

        return function() {
            if (id && this.reactiveObjects.has(id)) {
                this.reactiveObjects.get(id).watchers.delete(watcher);
            }
        };
    }

    // 安排更新
    scheduleUpdate = (objectId, property, oldValue, newValue) => {
        if (this.isBatching) {
            this.updatesQueue.add({ objectId, property, oldValue, newValue });
        } else {
            this.performUpdate(objectId, property, oldValue, newValue);
        }
    };

    // 执行更新
    performUpdate(objectId, property, oldValue, newValue) {
        const reactiveData = this.reactiveObjects.get(objectId);
        if (!reactiveData) return;

        const { reactive, dependencies, watchers } = reactiveData;

        // 通知监听器
        watchers.forEach(watcher => {
            try {
                watcher.callback(reactive, property, oldValue, newValue);
            } catch (error) {
                console.error('监听器执行失败:', error);
            }
        });

        // 使依赖的计算属性失效
        this.invalidateDependencies(objectId, property);
    }

    // 使依赖失效
    invalidateDependencies(objectId, property) {
        const dependencies = this.dependencyGraph.get(objectId);
        if (!dependencies) return;

        // 找出依赖于该属性的观察者
        for (const [watcher, watchedProperties] of dependencies) {
            if (watchedProperties.has(property) && watcher.invalidate) {
                watcher.invalidate();
            }
        }
    }

    // 批量更新
    batch(fn) {
        this.isBatching = true;
        try {
            fn();
        } finally {
            this.isBatching = false;
            // 处理排队的更新
            this.updatesQueue.forEach(update => {
                this.performUpdate(update.objectId, update.property, update.oldValue, update.newValue);
            });
            this.updatesQueue.clear();
        }
    }
}

// 依赖跟踪器
const DependencyTracker = {
    current: null
};

// 使用示例
const reactiveBinding = new ReactiveDataBinding();

// 创建响应式数据
const state = reactiveBinding.createReactiveObject({
    count: 0,
    user: {
        name: '张三',
        age: 25
    },
    items: []
});

// 创建计算属性
const doubleCount = reactiveBinding.computed(() => state.count * 2);
const userInfo = reactiveBinding.computed(() => `${state.user.name} (${state.user.age}岁)`);

// 添加监听器
const unwatchCount = reactiveBinding.watch(state, (newValue, property, oldValue) => {
    console.log(`state.${property} 变化: ${oldValue} → ${newValue}`);
});

const unwatchComputed = reactiveBinding.watch(doubleCount, (value) => {
    console.log('doubleCount 更新:', value);
});

// 测试响应式更新
reactiveBinding.batch(() => {
    state.count = 10;
    state.user.name = '李四';
    state.items.push({ id: 1, name: '项目1' });
});

console.log('doubleCount:', doubleCount.value);
console.log('userInfo:', userInfo.value);

// 清理
unwatchCount();
unwatchComputed();
```

### API 请求拦截器

```javascript
// API 请求拦截器
class APIInterceptor {
    constructor() {
        this.interceptors = {
            request: [],
            response: [],
            error: []
        };
        this.requestHistory = [];
        this.cache = new Map();
        this.config = {
            baseURL: '',
            timeout: 5000,
            retryCount: 3,
            retryDelay: 1000
        };
    }

    // 创建 HTTP 客户端代理
    createHTTPClient() {
        const fetch = this.createFetchProxy();
        const axios = this.createAxiosProxy();

        return {
            fetch: fetch,
            axios: axios,
            get: (url, config) => this.request('GET', url, config),
            post: (url, data, config) => this.request('POST', url, data, config),
            put: (url, data, config) => this.request('PUT', url, data, config),
            delete: (url, config) => this.request('DELETE', url, config),
            patch: (url, data, config) => this.request('PATCH', url, data, config)
        };
    }

    // 创建 Fetch 代理
    createFetchProxy() {
        const self = this;

        return new Proxy(window.fetch, {
            apply: function(target, thisArg, args) {
                const [url, options = {}] = args;

                // 构建请求配置
                const requestConfig = {
                    url: url,
                    method: options.method || 'GET',
                    headers: options.headers || {},
                    body: options.body,
                    timeout: options.timeout || self.config.timeout
                };

                // 执行请求拦截器
                const interceptedConfig = self.executeInterceptors('request', requestConfig);

                return self.executeRequest(interceptedConfig)
                    .then(response => {
                        // 执行响应拦截器
                        return self.executeInterceptors('response', response);
                    })
                    .catch(error => {
                        // 执行错误拦截器
                        return self.executeInterceptors('error', error);
                    });
            }
        });
    }

    // 创建 Axios 代理
    createAxiosProxy() {
        const self = this;

        // 模拟 axios 对象
        const axios = {
            request: (config) => self.request(config.method || 'GET', config.url, config),
            get: (url, config) => self.request('GET', url, config),
            post: (url, data, config) => self.request('POST', url, data, config),
            put: (url, data, config) => self.request('PUT', url, data, config),
            delete: (url, config) => self.request('DELETE', url, config),
            patch: (url, data, config) => self.request('PATCH', url, data, config),

            interceptors: {
                request: {
                    use: (onFulfilled, onRejected) => {
                        self.addInterceptor('request', onFulfilled, onRejected);
                        return axios.interceptors.request;
                    },
                    eject: (id) => {
                        self.removeInterceptor('request', id);
                    }
                },
                response: {
                    use: (onFulfilled, onRejected) => {
                        self.addInterceptor('response', onFulfilled, onRejected);
                        return axios.interceptors.response;
                    },
                    eject: (id) => {
                        self.removeInterceptor('response', id);
                    }
                }
            },

            defaults: self.config,
            create: (config) => {
                return this.createAxiosProxy.call(self, { ...this.config, ...config });
            }
        };

        return axios;
    }

    // 执行 HTTP 请求
    async request(method, url, data = null, config = {}) {
        const fullUrl = this.config.baseURL + url;
        const requestConfig = {
            method: method.toUpperCase(),
            url: fullUrl,
            headers: { ...this.config.headers, ...config.headers },
            data: data,
            timeout: config.timeout || this.config.timeout,
            retryCount: config.retryCount || this.config.retryCount,
            retryDelay: config.retryDelay || this.config.retryDelay
        };

        // 检查缓存
        if (method === 'GET' && config.cache !== false) {
            const cacheKey = this.getCacheKey(requestConfig);
            const cached = this.cache.get(cacheKey);
            if (cached && !this.isCacheExpired(cached)) {
                console.log('缓存命中:', cacheKey);
                return cached.data;
            }
        }

        // 执行请求拦截器
        const interceptedConfig = this.executeInterceptors('request', requestConfig);

        try {
            const response = await this.executeRequest(interceptedConfig);

            // 执行响应拦截器
            const finalResponse = await this.executeInterceptors('response', response);

            // 缓存 GET 请求
            if (method === 'GET' && config.cache !== false) {
                this.cacheResponse(requestConfig, finalResponse);
            }

            return finalResponse;
        } catch (error) {
            // 执行错误拦截器
            const finalError = await this.executeInterceptors('error', error);

            // 如果有重试配置，尝试重试
            if (config.retry !== false && requestConfig.retryCount > 0) {
                console.log(`请求失败，${requestConfig.retryCount} 秒后重试...`);
                await new Promise(resolve => setTimeout(resolve, requestConfig.retryDelay));
                requestConfig.retryCount--;
                return this.request(method, url, data, { ...config, retryCount: requestConfig.retryCount });
            }

            throw finalError;
        }
    }

    // 执行请求
    async executeRequest(config) {
        const startTime = performance.now();
        const requestId = Date.now().toString();

        // 记录请求历史
        this.requestHistory.push({
            id: requestId,
            config: config,
            startTime: startTime,
            status: 'pending'
        });

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), config.timeout);

            const response = await fetch(config.url, {
                method: config.method,
                headers: config.headers,
                body: config.body,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const endTime = performance.now();
            const duration = endTime - startTime;

            // 更新请求历史
            const historyEntry = this.requestHistory.find(h => h.id === requestId);
            if (historyEntry) {
                historyEntry.endTime = endTime;
                historyEntry.duration = duration;
                historyEntry.status = 'completed';
                historyEntry.response = {
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers
                };
            }

            // 解析响应
            const contentType = response.headers.get('content-type');
            let data;

            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            return {
                data: data,
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
                config: config,
                duration: duration
            };

        } catch (error) {
            const endTime = performance.now();
            const duration = endTime - startTime;

            // 更新请求历史
            const historyEntry = this.requestHistory.find(h => h.id === requestId);
            if (historyEntry) {
                historyEntry.endTime = endTime;
                historyEntry.duration = duration;
                historyEntry.status = 'failed';
                historyEntry.error = error.message;
            }

            throw error;
        }
    }

    // 添加拦截器
    addInterceptor(type, onFulfilled, onRejected) {
        const interceptor = {
            id: Date.now().toString(),
            onFulfilled: onFulfilled,
            onRejected: onRejected
        };

        this.interceptors[type].push(interceptor);
        return interceptor.id;
    }

    // 移除拦截器
    removeInterceptor(type, id) {
        const index = this.interceptors[type].findIndex(i => i.id === id);
        if (index !== -1) {
            this.interceptors[type].splice(index, 1);
            return true;
        }
        return false;
    }

    // 执行拦截器
    async executeInterceptors(type, data) {
        let result = data;

        for (const interceptor of this.interceptors[type]) {
            try {
                if (interceptor.onFulfilled) {
                    result = await interceptor.onFulfilled(result);
                }
            } catch (error) {
                if (interceptor.onRejected) {
                    result = await interceptor.onRejected(error);
                } else {
                    throw error;
                }
            }
        }

        return result;
    }

    // 缓存相关方法
    getCacheKey(config) {
        return `${config.method}:${config.url}:${JSON.stringify(config.params || {})}`;
    }

    isCacheExpired(cached) {
        if (!cached.ttl) return false;
        return Date.now() - cached.timestamp > cached.ttl;
    }

    cacheResponse(config, response) {
        const cacheKey = this.getCacheKey(config);
        this.cache.set(cacheKey, {
            data: response,
            timestamp: Date.now(),
            ttl: config.cacheTTL || 300000 // 5分钟
        });

        // 定期清理过期缓存
        if (this.cache.size > 1000) {
            this.cleanupCache();
        }
    }

    cleanupCache() {
        const now = Date.now();
        for (const [key, cached] of this.cache) {
            if (now - cached.timestamp > cached.ttl) {
                this.cache.delete(key);
            }
        }
    }

    // 获取请求历史
    getRequestHistory(filter = {}) {
        let history = [...this.requestHistory];

        if (filter.method) {
            history = history.filter(h => h.config.method === filter.method);
        }

        if (filter.status) {
            history = history.filter(h => h.status === filter.status);
        }

        if (filter.url) {
            history = history.filter(h => h.config.url.includes(filter.url));
        }

        return history.sort((a, b) => b.startTime - a.startTime);
    }

    // 统计信息
    getStatistics() {
        const history = this.requestHistory;
        const stats = {
            totalRequests: history.length,
            successfulRequests: history.filter(h => h.status === 'completed').length,
            failedRequests: history.filter(h => h.status === 'failed').length,
            averageResponseTime: history.reduce((sum, h) => sum + (h.duration || 0), 0) / history.length || 0,
            cacheHits: this.cache.size,
            interceptors: {
                request: this.interceptors.request.length,
                response: this.interceptors.response.length,
                error: this.interceptors.error.length
            }
        };

        return stats;
    }
}

// 使用示例
const apiInterceptor = new APIInterceptor();

// 添加请求拦截器
apiInterceptor.addInterceptor('request', (config) => {
    console.log('发送请求:', config.method, config.url);
    // 添加认证头
    config.headers.Authorization = 'Bearer token123';
    return config;
});

// 添加响应拦截器
apiInterceptor.addInterceptor('response', (response) => {
    console.log('收到响应:', response.status);
    return response;
});

// 添加错误拦截器
apiInterceptor.addInterceptor('error', (error) => {
    console.error('请求错误:', error);
    return Promise.reject(error);
});

// 创建 HTTP 客户端
const httpClient = apiInterceptor.createHTTPClient();

// 使用 Fetch 代理
httpClient.fetch('https://jsonplaceholder.typicode.com/posts/1')
    .then(response => response.json())
    .then(data => console.log('Fetch 结果:', data));

// 使用 Axios 代理
httpClient.axios.get('https://jsonplaceholder.typicode.com/posts/2')
    .then(response => console.log('Axios 结果:', response.data));

// 简化方法
httpClient.get('https://jsonplaceholder.typicode.com/posts/3')
    .then(response => console.log('GET 结果:', response.data));

// 查看统计
console.log('API 统计:', apiInterceptor.getStatistics());
```

## 最佳实践和性能考虑

### Proxy 使用最佳实践

```javascript
// Proxy 最佳实践指南
class ProxyBestPractices {
    constructor() {
        this.performanceMetrics = new Map();
        this.antipatterns = new Map();
        this.optimizations = new Map();
    }

    // 性能监控 Proxy
    createPerformanceAwareProxy(target, options = {}) {
        const metrics = {
            getOperations: 0,
            setOperations: 0,
            totalGetTime: 0,
            totalSetTime: 0,
            averageGetTime: 0,
            averageSetTime: 0
        };

        const updateMetrics = (operation, duration) => {
            if (operation === 'get') {
                metrics.getOperations++;
                metrics.totalGetTime += duration;
                metrics.averageGetTime = metrics.totalGetTime / metrics.getOperations;
            } else if (operation === 'set') {
                metrics.setOperations++;
                metrics.totalSetTime += duration;
                metrics.averageSetTime = metrics.totalSetTime / metrics.setOperations;
            }
        };

        return new Proxy(target, {
            get: function(target, property, receiver) {
                const startTime = performance.now();
                const result = Reflect.get(target, property, receiver);
                const endTime = performance.now();
                updateMetrics('get', endTime - startTime);

                // 性能警告
                if (metrics.averageGetTime > options.performanceThreshold || 1) {
                    console.warn(`GET 操作性能警告: ${property} 平均耗时 ${metrics.averageGetTime.toFixed(2)}ms`);
                }

                return result;
            },

            set: function(target, property, value, receiver) {
                const startTime = performance.now();
                const result = Reflect.set(target, property, value, receiver);
                const endTime = performance.now();
                updateMetrics('set', endTime - startTime);

                // 性能警告
                if (metrics.averageSetTime > options.performanceThreshold || 1) {
                    console.warn(`SET 操作性能警告: ${property} 平均耗时 ${metrics.averageSetTime.toFixed(2)}ms`);
                }

                return result;
            },

            // 添加性能监控方法
            getMetrics: function() {
                return { ...metrics };
            },

            resetMetrics: function() {
                metrics.getOperations = 0;
                metrics.setOperations = 0;
                metrics.totalGetTime = 0;
                metrics.totalSetTime = 0;
                metrics.averageGetTime = 0;
                metrics.averageSetTime = 0;
            }
        });
    }

    // 内存泄漏防护 Proxy
    createMemorySafeProxy(target, options = {}) {
        const weakReferences = new WeakMap();
        const strongReferences = new Map();
        const maxStrongReferences = options.maxStrongReferences || 100;
        let referenceCount = 0;

        return new Proxy(target, {
            get: function(target, property, receiver) {
                const value = Reflect.get(target, property, receiver);

                if (typeof value === 'object' && value !== null) {
                    // 使用 WeakRef 存储对象引用
                    if (!weakReferences.has(value)) {
                        const weakRef = new WeakRef(value);
                        weakReferences.set(value, weakRef);
                    }
                }

                return value;
            },

            set: function(target, property, value, receiver) {
                if (typeof value === 'object' && value !== null) {
                    // 限制强引用数量
                    if (referenceCount >= maxStrongReferences) {
                        console.warn('达到强引用限制，清理旧引用');
                        this.cleanupStrongReferences();
                    }

                    if (!strongReferences.has(value)) {
                        strongReferences.set(value, Date.now());
                        referenceCount++;
                    }
                }

                return Reflect.set(target, property, value, receiver);
            },

            cleanupStrongReferences: function() {
                const now = Date.now();
                const cutoffTime = now - 30000; // 30秒

                for (const [value, timestamp] of strongReferences) {
                    if (timestamp < cutoffTime) {
                        strongReferences.delete(value);
                        referenceCount--;
                    }
                }
            },

            getMemoryStats: function() {
                return {
                    weakReferences: weakReferences.size,
                    strongReferences: strongReferences.size,
                    referenceCount: referenceCount,
                    maxStrongReferences: maxStrongReferences
                };
            }
        });
    }

    // 错误处理增强 Proxy
    createErrorResilientProxy(target, options = {}) {
        const errorHandlers = {
            get: options.getErrorHandler || ((property, error) => {
                console.error(`GET 错误 [${property}]:`, error);
                return options.defaultGetValue || undefined;
            }),

            set: options.setErrorHandler || ((property, error) => {
                console.error(`SET 错误 [${property}]:`, error);
                return false;
            }),

            apply: options.applyErrorHandler || ((property, error) => {
                console.error(`APPLY 错误 [${property}]:`, error);
                return options.defaultReturnValue || undefined;
            })
        };

        return new Proxy(target, {
            get: function(target, property, receiver) {
                try {
                    const value = Reflect.get(target, property, receiver);
                    if (typeof value === 'function') {
                        return function(...args) {
                            try {
                                return value.apply(target, args);
                            } catch (error) {
                                return errorHandlers.apply(property, error);
                            }
                        };
                    }
                    return value;
                } catch (error) {
                    return errorHandlers.get(property, error);
                }
            },

            set: function(target, property, value, receiver) {
                try {
                    return Reflect.set(target, property, value, receiver);
                } catch (error) {
                    return errorHandlers.set(property, error);
                }
            }
        });
    }

    // 类型安全 Proxy
    createTypeSafeProxy(target, typeSchema) {
        const typeValidators = {
            string: (value) => typeof value === 'string',
            number: (value) => typeof value === 'number' && !isNaN(value),
            boolean: (value) => typeof value === 'boolean',
            object: (value) => typeof value === 'object' && value !== null,
            array: (value) => Array.isArray(value),
            function: (value) => typeof value === 'function',
            null: (value) => value === null,
            undefined: (value) => value === undefined
        };

        const validateType = (property, value) => {
            const expectedType = typeSchema[property];
            if (!expectedType) return true;

            const validator = typeValidators[expectedType];
            if (!validator) {
                console.warn(`未知的类型验证器: ${expectedType}`);
                return true;
            }

            return validator(value);
        };

        return new Proxy(target, {
            set: function(target, property, value, receiver) {
                if (!validateType(property, value)) {
                    const expectedType = typeSchema[property];
                    throw new TypeError(`类型错误: ${property} 应该是 ${expectedType}，但是得到 ${typeof value}`);
                }

                return Reflect.set(target, property, value, receiver);
            }
        });
    }

    // 防抖 Proxy
    createDebouncedProxy(target, options = {}) {
        const debounceTimeouts = new Map();
        const defaultDelay = options.delay || 300;

        return new Proxy(target, {
            get: function(target, property, receiver) {
                const value = Reflect.get(target, property, receiver);

                if (typeof value === 'function') {
                    return function(...args) {
                        const methodName = property;
                        const delay = options.methodDelays?.[methodName] || defaultDelay;

                        return new Promise((resolve) => {
                            if (debounceTimeouts.has(methodName)) {
                                clearTimeout(debounceTimeouts.get(methodName));
                            }

                            const timeoutId = setTimeout(() => {
                                try {
                                    const result = value.apply(target, args);
                                    resolve(result);
                                } catch (error) {
                                    reject(error);
                                } finally {
                                    debounceTimeouts.delete(methodName);
                                }
                            }, delay);

                            debounceTimeouts.set(methodName, timeoutId);
                        });
                    };
                }

                return value;
            }
        });
    }

    // 节流 Proxy
    createThrottledProxy(target, options = {}) {
        const throttleStates = new Map();
        const defaultInterval = options.interval || 100;

        return new Proxy(target, {
            get: function(target, property, receiver) {
                const value = Reflect.get(target, property, receiver);

                if (typeof value === 'function') {
                    return function(...args) {
                        const methodName = property;
                        const interval = options.methodIntervals?.[methodName] || defaultInterval;

                        if (!throttleStates.has(methodName)) {
                            throttleStates.set(methodName, { lastCall: 0, pending: false });
                        }

                        const state = throttleStates.get(methodName);
                        const now = Date.now();

                        if (now - state.lastCall >= interval) {
                            state.lastCall = now;
                            return value.apply(target, args);
                        } else if (!state.pending) {
                            state.pending = true;
                            setTimeout(() => {
                                state.lastCall = Date.now();
                                state.pending = false;
                                value.apply(target, args);
                            }, interval - (now - state.lastCall));
                        }
                    };
                }

                return value;
            }
        });
    }

    // 最佳实践检查器
    createBestPracticeChecker(target) {
        const violations = [];

        return new Proxy(target, {
            get: function(target, property, receiver) {
                // 检查常见反模式
                this.checkAntipatterns('get', property);

                return Reflect.get(target, property, receiver);
            },

            set: function(target, property, value, receiver) {
                // 检查常见反模式
                this.checkAntipatterns('set', property);

                // 检查循环引用
                if (typeof value === 'object' && value !== null) {
                    if (this.hasCircularReference(value)) {
                        violations.push({
                            type: 'circular_reference',
                            property: property,
                            message: `检测到循环引用: ${property}`
                        });
                    }
                }

                return Reflect.set(target, property, value, receiver);
            },

            checkAntipatterns: function(operation, property) {
                // 检查过度使用 Proxy
                if (target._isProxy) {
                    violations.push({
                        type: 'proxy_chain',
                        operation: operation,
                        property: property,
                        message: '检测到 Proxy 链，可能导致性能问题'
                    });
                }

                // 检查频繁访问的属性
                const accessKey = `${operation}:${property}`;
                if (!this.accessCounts) {
                    this.accessCounts = new Map();
                }

                const count = this.accessCounts.get(accessKey) || 0;
                this.accessCounts.set(accessKey, count + 1);

                if (count > 1000) {
                    violations.push({
                        type: 'frequent_access',
                        operation: operation,
                        property: property,
                        count: count,
                        message: `属性 ${property} 被频繁访问，考虑缓存`
                    });
                }
            },

            hasCircularReference: function(obj, seen = new WeakSet()) {
                if (seen.has(obj)) return true;
                seen.add(obj);

                for (const value of Object.values(obj)) {
                    if (typeof value === 'object' && value !== null) {
                        if (this.hasCircularReference(value, seen)) {
                            return true;
                        }
                    }
                }

                return false;
            },

            getViolations: function() {
                return [...violations];
            },

            clearViolations: function() {
                violations.length = 0;
            }
        });
    }

    // 性能优化建议
    getOptimizationRecommendations() {
        return {
            performance: [
                '避免在热代码路径中使用 Proxy',
                '使用 Reflect API 而不是直接调用目标方法',
                '限制 Proxy 嵌套深度',
                '考虑使用 Object.defineProperty 替代简单的属性拦截'
            ],

            memory: [
                '使用 WeakRef 和 WeakMap 避免内存泄漏',
                '及时清理不再需要的引用',
                '避免在 Proxy 中存储大量数据',
                '使用对象池管理频繁创建的对象'
            ],

            debugging: [
                '添加详细的日志记录',
                '实现错误边界处理',
                '提供性能监控接口',
                '支持条件性启用/禁用代理功能'
            ]
        };
    }
}

// 使用示例
const bestPractices = new ProxyBestPractices();

// 性能监控示例
const monitoredObj = bestPractices.createPerformanceAwareProxy(
    { value: 42, data: [1, 2, 3] },
    { performanceThreshold: 0.1 }
);

for (let i = 0; i < 100; i++) {
    monitoredObj.value;
    monitoredObj.data.push(i);
}

console.log('性能指标:', monitoredObj.getMetrics());

// 内存安全示例
const memorySafeObj = bestPractices.createMemorySafeProxy(
    { cache: new Map() },
    { maxStrongReferences: 5 }
);

// 类型安全示例
const typedObj = bestPractices.createTypeSafeProxy(
    { name: '', age: 0, active: true },
    {
        name: 'string',
        age: 'number',
        active: 'boolean'
    }
);

try {
    typedObj.age = 'invalid'; // 会抛出类型错误
} catch (error) {
    console.log('类型检查捕获错误:', error.message);
}

// 最佳实践检查示例
const checkedObj = bestPractices.createBestPracticeChecker({
    data: { items: [] }
});

checkedObj.data.items.push({ id: 1 });
checkedObj.data.items.push({ id: 2 });

console.log('违规检查:', checkedObj.getViolations());

// 优化建议
console.log('优化建议:', bestPractices.getOptimizationRecommendations());
```

## 总结

JavaScript 元编程和 Proxy 提供了强大的能力来操作和扩展语言本身：

1. **元编程基础**：理解元编程概念和基本技术
2. **Proxy 深入**：掌握所有陷阱处理器和高级应用
3. **高级模式**：组合代理、装饰器、状态管理等模式
4. **实际应用**：数据绑定、API 拦截器、响应式系统
5. **最佳实践**：性能优化、内存管理、错误处理

通过合理使用这些技术，你可以构建更加灵活、强大和可维护的 JavaScript 应用程序。Proxy 的强大能力使其成为现代 JavaScript 框架和库的核心技术之一。

这个完整的高级 JavaScript 系列涵盖了从底层引擎原理到高级应用的各个方面，为深入理解 JavaScript 提供了全面的技术基础。