# platiziverse-mqtt

## `agent/connected`

```js 
{
  agent: {
    uuid, // auto gen
    username, // definir por config
    name, // definir por config
    hostname, // obtener del s.o
    pid // obtener del proceso
  }
}
```

## `agent/disconnected`

```js 
{
  agent: {
    uuid
  }
}
```

## `agent/message`
```js
{
  agent,
  metrics: [{
    type,
    value
  }],
  timestamp, // generar cuando se crea el mensaje
}
```