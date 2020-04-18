import {ErrorConfig, ApolloError} from 'apollo-errors';
import config from '../../config';

const isDev = config.env !== 'production';

/**
 * Creates GraphQL error
 * @param {string} name
 * @param errorMessage error message
 * @param {ErrorConfig} config
 * @returns {ApolloError}
 */
export function createError(
  name: string,
  errorMessage: string,
  config: ErrorConfig = {message: ''},
) {
  return class ApolloComputedError extends ApolloError {
    constructor(overriddenConfig: ErrorConfig = {message: errorMessage}) {
      const conf = {
        ...config,
        ...overriddenConfig,
        options: {
          showPath: isDev,
          showLocations: isDev,
        },
      };
      super(name, conf, conf);
    }
  };
}
