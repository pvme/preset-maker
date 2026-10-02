import { expect, test } from "vitest";
import { buildEmbedLink } from "../src/utility/embed-link";

test("uses the static landscape URL with an explicit layout", () => {
  expect(buildEmbedLink("preset-1", "7x4", "https://example.test/embeds"))
    .toBe("https://example.test/embeds/preset-1/?layout=7x4");
});

test("uses the portrait static URL and safely encodes preset IDs", () => {
  expect(buildEmbedLink("a/b ?", "4x7", "https://example.test/embeds/"))
    .toBe("https://example.test/embeds/a%2Fb%20%3F/4x7/?layout=4x7");
});

test("adds only the stable layout query", () => {
  expect(buildEmbedLink("stable", "7x4", "https://example.test/embeds/") )
    .toBe("https://example.test/embeds/stable/?layout=7x4");
});
