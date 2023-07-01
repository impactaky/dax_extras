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

export type ApplyFunction<T, U> = (arg0: T) => U | U[] | undefined;

export class ApplyStream<T, U> extends TransformStream<T, U> {
  constructor(private applyFunction: ApplyFunction<T, U>) {
    super({
      transform: (chunk, controller) => this.#handle(chunk, controller),
    });
  }

  #handle(chunk: T, controller: TransformStreamDefaultController<U>) {
    const applied = this.applyFunction(chunk);
    if (applied == undefined) {
      return;
    }
    if (Array.isArray(applied)) {
      applied.forEach((item) => controller.enqueue(item));
    } else {
      controller.enqueue(applied);
    }
  }
}
