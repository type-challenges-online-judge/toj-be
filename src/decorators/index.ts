import type { Request } from 'express';

export function Middleware(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor,
) {
  const method = descriptor.value;

  descriptor.value = function (req: Request) {
    const args = target.extractors.map(({ type, value }) => {
      switch (type) {
        case 'query':
          return req.query[value];
        case 'request':
          return req;
        case 'cookies':
          return req.cookies[value];
      }
    });

    return method(...args);
  };
}

export function Query(property: string) {
  return function (target: any, propertyKey: string, parameterIndex: number) {
    if (!target.extractors) {
      target.extractors = [];
    }

    target.extractors.unshift({ type: 'query', value: property });
  };
}

export function Req(target: any, propertyKey: string, parameterIndex: number) {
  if (!target.extractors) {
    target.extractors = [];
  }

  target.extractors.unshift({ type: 'request', value: null });
}

export function Cookies(key: string) {
  return function (target: any, propertyKey: string, parameterIndex: number) {
    if (!target.extractors) {
      target.extractors = [];
    }

    target.extractors.unshift({ type: 'cookies', value: key });
  };
}
