/**
 * 网络拦截。
 *
 * 回放测试的价值建立在「真的没有发出请求」上。只靠人自觉，迟早会有一条测试偷偷打了网络
 * 却在本地因为缓存或网络抖动而时红时绿。把 fetch 换掉，让任何真实请求立刻失败，
 * 这个保证才是硬的。
 *
 * 只拦截 `fetch`：项目里没有别的出网方式（不引 SDK、不用 http 模块），
 * 拦一个点就够，多拦反而会在升级 Node 时踩到内部实现的坑。
 */

/** 装上网闸，返回卸载函数。容器里已经装过时返回空操作，避免测试互相踩。 */
export function installNetworkGuard(): () => void {
  const original = globalThis.fetch;

  const guard = ((input: unknown): Promise<never> => {
    const target = typeof input === 'string' ? input : String(input);
    return Promise.reject(new Error(`测试期间禁止真实网络请求：${target}`));
  }) as typeof globalThis.fetch;

  globalThis.fetch = guard;

  return () => {
    globalThis.fetch = original;
  };
}
