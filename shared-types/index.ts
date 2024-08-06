export type Attribute = (
{
    display_type:"switch",
    value:boolean|undefined,
}|
{
  display_type:"radio-image",
  value:{
    label:string,
    src:string,
  }|undefined
}|
{
    display_type:"region",
    value:string[]|undefined,
}|
{
    display_type:|"radio-button"|"image"|"select"|"color",
    value:string|undefined,
}) & {
    trait_type:string,
}

export type ProductMetaData = {
    id:string,
    name:string,
    description:string,
    image:string,
    categories:string[],
    collection_id:string,
    attributes:Attribute[]
}

