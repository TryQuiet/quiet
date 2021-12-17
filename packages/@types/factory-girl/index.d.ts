declare module 'factory-girl' {
  type ActionCreator<T> = (payload: T) => { payload: T };
  class FactoryGirl {
    constructor();

    assoc: typeof factory.assoc;
    assocAttrs: typeof factory.assocAttrs;
    assocMany: typeof factory.assocMany;
    assocAttrsMany: typeof factory.assocAttrsMany;
    attrs: typeof factory.attrs;
    attrsMany: typeof factory.attrsMany;
    build<T extends ActionCreator<P>>(
      name: string,
      attrs?: Attributes<Partial<P>>,
      buildOptions?: BuildOptions
    ): Promise<ReturnType<T>>;
    buildMany: typeof factory.buildMany;
    cleanUp(): typeof factory.cleanUp;
    create: typeof factory.create;
    createMany: typeof factory.createMany;
    define: typeof factory.define;
    extend: typeof factory.extend;
    seq: typeof factory.seq;
    sequence: typeof factory.sequence;
    setAdapter: typeof factory.setAdapter;
    resetSequence: typeof factory.resetSequence;
    resetSeq: typeof factory.resetSeq;
    chance: typeof factory.chance;
  }

  factory.FactoryGirl = FactoryGirl;
}
