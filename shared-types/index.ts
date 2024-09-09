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
    display_type:"color",
    value:{
        label:string,
        color:string,
    }|undefined,
}|
{
    display_type:|"radio-button"|"image"|"select",
    value:string|undefined,
}) & {
    trait_type:string,
}


export const displayables = [
    "color",
    "radio-button",
    "radio-image",
    "select",
    "switch",
] as const;
export type Displayable = (typeof displayables)[number];

export type ProductMetaData = {
    id:string,
    name:string,
    description:string,
    image:string,
    categories:string[],
    collection_id:string,
    attributes:Attribute[]
}

export type OrderMetaData = {
    id:string,
    postalAddress:string,
    trackingNumber:string,
    countryCity:{
        country:string,
        city:string,
    },
    messages:{
        text:string,
        isBuyer:boolean,
        media:string[],
        date:number
    }[]
}



export type SoketMessage = {jwt:string} | {
    jwt:string;
    orderId:string;
    media: string[];
    text: string;
};

export type SoketMessageRecieve = {
    message:OrderMetaData["messages"][number],
    orderId:string,
}