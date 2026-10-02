import { expect, test } from "vitest";
import { buildEmbedLink } from "../src/utility/embed-link";

test("uses the explicit static landscape layout URL", () => {
  expect(buildEmbedLink("preset-1", "7x4", "https://example.test/embeds"))
    .toBe("https://example.test/embeds/preset-1/7x4/");
});

test("uses the portrait static URL and safely encodes preset IDs", () => {
  expect(buildEmbedLink("a/b ?", "4x7", "https://example.test/embeds/"))
    .toBe("https://example.test/embeds/a%2Fb%20%3F/4x7/");
});

test("does not add a query or cache-buster", () => {
  expect(buildEmbedLink("stable", "7x4", "https://example.test/embeds/") )
    .toBe("https://example.test/embeds/stable/7x4/");
});
