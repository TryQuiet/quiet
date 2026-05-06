declare module 'factory-girl' {
  type ActionCreator<T> = (payload: T) => { payload: T }
  class FactoryGirl {
    constructor()

    assoc: typeof factory.assoc
    assocAttrs: typeof factory.assocAttrs
    assocMany: typeof factory.assocMany
    assocAttrsMany: typeof factory.assocAttrsMany
    attrs: typeof factory.attrs
    attrsMany: typeof factory.attrsMany
    build<T = any>(name: string, attrs?: Attributes<Partial<T>>, buildOptions?: BuildOptions): Promise<T>
    buildMany: typeof factory.buildMany
    cleanUp(): typeof factory.cleanUp
    save<T = any>(name: string, attrs?: Attributes<Partial<T>>, buildOptions?: BuildOptions): Promise<T>
    create<T = any>(name: string, attrs?: Attributes<Partial<T>>, buildOptions?: BuildOptions): Promise<T>
    createMany<T = any>(name: string, attrs?: Attributes<Partial<T>>, buildOptions?: BuildOptions): Promise<T[]>
    define: typeof factory.define
    extend: typeof factory.extend
    seq: typeof factory.seq
    sequence: typeof factory.sequence
    setAdapter: typeof factory.setAdapter
    resetSequence: typeof factory.resetSequence
    resetSeq: typeof factory.resetSeq
    chance: typeof factory.chance
  }

  factory.FactoryGirl = FactoryGirl

  export class ObjectAdapter {
    constructor()
    build(Model: any, attrs: any, buildOptions?: any): any
    save(Model: any, attrs: any, buildOptions?: any): any
    destroy(model: any, Model: any): Promise<any>
    get(model: any, attr: string, Model?: any): any
    set(props: any, model: any, Model?: any): any
  }
}
