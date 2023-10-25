import { backOff } from "exponential-backoff";

export async function sendWebhook(params: any, webhooks: string[]) {
  for (const url of webhooks) {
    try {
      const resp = await backOff(
        () => {
          return fetch(url, {
            method: "POST",
            body: JSON.stringify(params),
            headers: {
              "Content-Type": "application/json",
            },
          });
        },
        {
          retry: (e, attemptNumber) => {
            console.log(attemptNumber, " <---> ", e);
            return true;
          },
        },
      );
      console.log("resp ==>", resp.status, " : ", resp.statusText);
    } catch (e) {
      console.error(e);
    }
  }
}
