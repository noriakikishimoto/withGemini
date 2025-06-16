declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}

// 必要であれば、Sass Modules の場合も同様に定義できます
declare module "*.module.scss" {
  const classes: { [key: string]: string };
  export default classes;
}

// 画像などの型定義がなければこれも追加しておくと良い
declare module "*.svg" {
  const content: string;
  export default content;
}
declare module "*.png" {
  const content: string;
  export default content;
}
declare module "*.jpg" {
  const content: string;
  export default content;
}
declare module "*.jpeg" {
  const content: string;
  export default content;
}
declare module "*.gif" {
  const content: string;
  export default content;
}
