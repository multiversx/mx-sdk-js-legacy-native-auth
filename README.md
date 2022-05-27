# Native Authenticator for JavaScript

Native Authenticator for JavaScript and TypeScript (written in TypeScript).

## Distribution

[npm](https://www.npmjs.com/package/@elrondnetwork/native-auth)

## Example
### Client-side

```js
const client = new NativeAuthClient();
const init = await client.initialize();

// obtain signature by signing token

const accessToken = client.getToken(address, init, signature);
```

### Client-side config

When initializing the client object, an optional config can also be specified with the following properties:

```js
{
  // When used from within a browser, will contain the hostname by default.
  // It can be overridden for special situations
  // Note: The server-side component will validate the `origin` header, which must
  // match with the provided host in the client-side configuration
  host: string = 'myApp.com';

  // The endpoint from where the current block information will be fetched upon initialization.
  // The default value points to the mainnet API, but can be overridden to be network-specific
  // or to point to a self-hosted location
  apiUrl: string = 'https://api.elrond.com';

  // TTL that will be encoded in the access token.
  // This value will also be validated by the server and must not be greater than the maximum ttl allowed.
  // Default: one day (86400 seconds)
  expirySeconds: number = 60 * 60 * 24;
}
```

### Server-side

```js
const server = new NativeAuthServer();
const result = await server.validate(accessToken);
```


### Server-side config

```js
{
  // The endpoint from where the current block information will be fetched upon validation.
  // The default value points to the mainnet API, but can be overridden to be network-specific
  // or to point to a self-hosted location
  apiUrl: string = 'https://api.elrond.com';

  // An optional list of accepted hosts in case the server component must validate the incoming requests
  // by domain
  acceptedHosts: string[] = [];

  // Maximum allowed TTL from the token.
  // Default: one day (86400 seconds)
  maxExpirySeconds: number = 86400;

  // An optional implementation of the caching interface used for resolving 
  // latest block timestamp and also to validate and provide a block timestamp given a certain block hash.
  // It can be integrated with popular caching mechanisms such as redis
  cache?: NativeAuthCacheInterface;
}
```