const zlib = require('zlib');

exports.handler = async function (event, context) {
  const b64encoded = event.awslogs.data;
  const zipped = Buffer.from(b64encoded, 'base64');
  const unzipped = zlib.gunzipSync(zipped);
  const logs = JSON.parse(unzipped.toString('utf8'));
  const logEvents = logs.logEvents;

  const region = context.invokedFunctionArn.split(":")[3];
  const response = await fetch("https://in.logs.betterstack.com", {
    method: "POST",
    body: JSON.stringify(logEvents.map(e => ({
      ...e,
      region,
      message: "[" + region + "] " + e.message,
    }))),
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + process.env.BETTERSTACK_LOGS_TOKEN
    }
  })

  if (response.status !== 202) {
    const body = await response.text();
    throw new Error("Failed to send logs to BetterStack: " + response.status + " " + body);
  }

  return context.logStreamName;
};