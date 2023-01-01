export default interface Namespace {
  modulePrefix: string;
  podModulePrefix?: string | undefined;
  [k: string]: string | undefined;
}
