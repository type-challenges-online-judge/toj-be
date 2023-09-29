import type { Request } from 'express';

export const Middleware =
  (): MethodDecorator =>
  (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
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
          case 'authorization':
            if (!req.headers.authorization) {
              return null;
            }

            return req.headers.authorization.split(`${value} `)[1];
        }
      });

      return method(...args);
    };
  };

export const Query =
  (property: string): ParameterDecorator =>
  (target: any) => {
    if (!target.extractors) {
      target.extractors = [];
    }

    target.extractors.unshift({ type: 'query', value: property });
  };

export const Req = (): ParameterDecorator => (target: any) => {
  if (!target.extractors) {
    target.extractors = [];
  }

  target.extractors.unshift({ type: 'request', value: null });
};

export const Cookies =
  (key: string): ParameterDecorator =>
  (target: any) => {
    if (!target.extractors) {
      target.extractors = [];
    }

    target.extractors.unshift({ type: 'cookies', value: key });
  };

export const Auth =
  (type: string): ParameterDecorator =>
  (target: any) => {
    if (!target.extractors) {
      target.extractors = [];
    }

    target.extractors.unshift({ type: 'authorization', value: type });
  };
