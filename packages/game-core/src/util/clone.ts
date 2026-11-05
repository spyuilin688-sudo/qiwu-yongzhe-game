/**
 * 遊戲狀態只含 JSON 可序列化的純資料，因此以 JSON 往返複製。
 * 交易在副本上執行，任一步驟失敗就丟棄副本，達成「整筆成功或整筆不變」。
 */
export function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export type DeepReadonly<T> = T extends (infer U)[]
  ? readonly DeepReadonly<U>[]
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;
