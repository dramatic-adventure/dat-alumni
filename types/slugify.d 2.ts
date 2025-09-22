declare module "slugify" {
  export default function slugify(
    str: string,
    options?:
      | {
          replacement?: string; // replace spaces with replacement char, defaults to `-`
          remove?: RegExp;      // remove characters matching regex
          lower?: boolean;      // convert to lower case
          strict?: boolean;     // strip special characters except replacement
          locale?: string;      // language code of the locale to use
          trim?: boolean;       // trim leading and trailing replacement chars
        }
      | string
  ): string;
}
