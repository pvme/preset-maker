export async function copyReadyEmbedLink(getUrl: () => Promise<string | undefined>) {
  const url = getUrl().then(value => {
    if (!value) throw new Error("Embed is not ready yet");
    return value;
  });
  // Start clipboard access during the tap, retaining Safari's user gesture
  // while the server verifies that the published embed is still current.
  if (navigator.clipboard.write && typeof ClipboardItem !== "undefined") {
    const text = url.then(value => new Blob([value], { type: "text/plain" }));
    // A denied clipboard operation must not leave its data promise unhandled.
    void text.catch(() => {});
    await navigator.clipboard.write([new ClipboardItem({ "text/plain": text })]);
  } else {
    await navigator.clipboard.writeText(await url);
  }
}
