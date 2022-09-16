interface PromiseConstructor {
  all<T extends unknown[]>(promises: readonly [...T]): Promise<{ [I in keyof T]: T[I] extends Promise<infer A> ? A : T[I] }>;
}

export default PromiseConstructor;
