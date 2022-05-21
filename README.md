# Native Authenticator for JavaScript

Native Authenticator for JavaScript and TypeScript (written in TypeScript).

## Distribution

[npm](https://www.npmjs.com/package/@elrondnetwork/native-auth)

## Usage (client-side)

```js
const client = new NativeAuthClient();
const init = await client.initialize();

// obtain signature by signing token

const accessToken = client.getAccessToken(address, init, signature);
```

## Usage (servier-side)

```js
const server = new NativeAuthServer();
const result = await server.validate(accessToken);
```
