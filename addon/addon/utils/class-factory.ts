import type EmberObject from "@ember/object";

type EmberClass = typeof EmberObject;

function isEmberClass(klass: unknown): klass is EmberClass {
  return (
    typeof klass === "object" &&
    klass !== null &&
    "extend" in klass &&
    typeof (klass as { extend: unknown }).extend === "function"
  );
}

export default function classFactory(klass: EmberClass | unknown) {
  return {
    create(injections: Parameters<EmberClass["extend"]>[0]) {
      if (isEmberClass(klass)) {
        return klass.extend(injections);
      } else {
        return klass;
      }
    },
  };
}
