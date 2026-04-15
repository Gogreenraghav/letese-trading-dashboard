// Tell TypeScript that CSS imports are valid
declare module '*.css' {
  const content: { [className: string]: string }
  export default content
}
