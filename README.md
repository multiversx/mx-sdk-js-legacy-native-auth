# Native Authenticator for JavaScript

Native Authenticator for JavaScript and TypeScript (written in TypeScript).

## Distribution

[npm](https://www.npmjs.com/package/@elrondnetwork/native-auth)

## Usage (client-side)

```js
const client = new NativeAuthClient();
const token = await client.getSignableToken();

// obtain signature by signing token

const accessToken = client.getAccessToken(address, token, signature);
```
