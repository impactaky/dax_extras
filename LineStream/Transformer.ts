export type MapFunction<T, U> = (arg0: T) => U;

export class MapStream<T, U> extends TransformStream<T, U> {
  constructor(private mapFunction: MapFunction<T, U>) {
    super({
      transform: (chunk, controller) => this.#handle(chunk, controller),
    });
  }
  #handle(chunk: T, controller: TransformStreamDefaultController<U>) {
    controller.enqueue(this.mapFunction(chunk));
  }
}

export type FilterFunction<T> = (arg0: T) => boolean;

export class FilterStream<T> extends TransformStream<T, T> {
  constructor(private filterFunction: FilterFunction<T>) {
    super({
      transform: (chunk, controller) => this.#handle(chunk, controller),
    });
  }
  #handle(chunk: T, controller: TransformStreamDefaultController<T>) {
    if (this.filterFunction(chunk)) {
      controller.enqueue(chunk);
    }
  }
}
