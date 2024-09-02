import { Api } from '../dapp/src/api';
import { AssetListBaseForString, EmporionClient } from "../client-ts/Emporion.client"
import { Secp256k1HdWallet } from "@cosmjs/amino";
import { productMetaHash, toPrefix } from '../backend/utils';
import { loadEnvFile } from './utils';
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { GasPrice } from "@cosmjs/stargate";
import { ProductMetaData } from '../shared-types';
import { extractAttr } from '../backend/utils';


const {
    ENDPOINT = "",
    MNEMONIC_1 = "",
} = Bun.env;



const api = new Api('http://localhost:3000', '');


const signMessage = async (adminClient: Secp256k1HdWallet, adminAddress: string, nonce: string) => {
    const signDoc = {
        chain_id: '',
        account_number: '0',
        sequence: '0',
        fee: {
            gas: '0',
            amount: [],
        },
        msgs: [
            {
                type: 'sign/MsgSignData',
                value: {
                    signer: toPrefix(adminAddress, "cosmos"),
                    data: Buffer.from(nonce).toString('base64'),
                },
            },
        ],
        memo: '',
    };
    return (await adminClient.signAmino(adminAddress, signDoc)).signature
}


const products = [
    {
        id: "",
        name: "GARMIN Instinct® 2 - Standard Edition",
        categories: ['watches', 'sporting', 'fitness-equipment', 'fashion-mens'],
        description: `This rugged GPS smartwatch is tough enough to keep up with you and unique enough to fit your style. Now it comes in two sizes to fit every wrist.This rugged watch is water-rated to 100 meters and is thermal and shock resistant. Plus, with a fiber-reinforced polymer case and chemically strengthened scratch-resistant lens, this device is built to endure.`,
        image: "1.webp",
        attributes: [
            {
                display_type: 'image',
                trait_type: "2.webp",
                value: "2.webp",
            },
            {
                display_type: 'image',
                trait_type: "3.webp",
                value: "3.webp",
            },
            {
                display_type: 'image',
                trait_type: "4.webp",
                value: "4.webp",
            },
            {
                display_type: 'image',
                trait_type: "5.webp",
                value: "5.webp",
            },
            {
                display_type: "radio-image",
                trait_type: "Color",
                value: {
                    label: "Graphite",
                    src: "graypattern.png"
                }
            },
            {
                display_type: "radio-button",
                trait_type: "Size",
                value: "40MM"
            },
            {
                display_type: "radio-button",
                trait_type: "Edition",
                value: "Standard"
            },
            {
                display_type: "switch",
                trait_type: "Solar",
                value: false,
            }
        ],
        collection_id: "Instinct®"
    },
    {
        id: "",
        name: "GARMIN Instinct® 2 - Standard Edition",
        categories: ['watches', 'sporting', 'fitness-equipment', 'fashion-mens'],
        description: `This rugged GPS smartwatch is tough enough to keep up with you and unique enough to fit your style. Now it comes in two sizes to fit every wrist.This rugged watch is water-rated to 100 meters and is thermal and shock resistant. Plus, with a fiber-reinforced polymer case and chemically strengthened scratch-resistant lens, this device is built to endure.`,
        image: "white.webp",
        attributes: [
            {
                display_type: 'image',
                trait_type: "white2.webp",
                value: "white2.webp",
            },
            {
                display_type: 'image',
                trait_type: "white3.webp",
                value: "white3.webp",
            },
            {
                display_type: "radio-image",
                trait_type: "Color",
                value: {
                    label: "Mist Gray",
                    src: "whitepattern.png"
                }
            },
            {
                display_type: "radio-button",
                trait_type: "Size",
                value: "40MM"
            },
            {
                display_type: "radio-button",
                trait_type: "Edition",
                value: "Standard"
            },
            {
                display_type: "switch",
                trait_type: "Solar",
                value: false,
            }
        ],
        collection_id: "Instinct®"
    },
    {
        id: "",
        name: "GARMIN Instinct® 2 - Standard Edition",
        categories: ['watches', 'sporting', 'fitness-equipment', 'fashion-mens'],
        description: `This rugged GPS smartwatch is tough enough to keep up with you and unique enough to fit your style. Now it comes in two sizes to fit every wrist.This rugged watch is water-rated to 100 meters and is thermal and shock resistant. Plus, with a fiber-reinforced polymer case and chemically strengthened scratch-resistant lens, this device is built to endure.`,
        image: "white.webp",
        attributes: [
            {
                display_type: 'image',
                trait_type: "white2.webp",
                value: "white2.webp",
            },
            {
                display_type: 'image',
                trait_type: "white3.webp",
                value: "white3.webp",
            },
            {
                display_type: "radio-image",
                trait_type: "Color",
                value: {
                    label: "Mist Gray",
                    src: "whitepattern.png"
                }
            },
            {
                display_type: "radio-button",
                trait_type: "Size",
                value: "45MM"
            },
            {
                display_type: "radio-button",
                trait_type: "Edition",
                value: "Standard"
            },
            {
                display_type: "switch",
                trait_type: "Solar",
                value: false,
            }
        ],
        collection_id: "Instinct®"
    },
    {
        id: "",
        name: "GARMIN Instinct® 2 - Standard Edition",
        categories: ['watches', 'sporting', 'fitness-equipment', 'fashion-mens'],
        description: `This rugged GPS smartwatch is tough enough to keep up with you and unique enough to fit your style. Now it comes in two sizes to fit every wrist.This rugged watch is water-rated to 100 meters and is thermal and shock resistant. Plus, with a fiber-reinforced polymer case and chemically strengthened scratch-resistant lens, this device is built to endure.`,
        image: "1.webp",
        attributes: [
            {
                display_type: 'image',
                trait_type: "2.webp",
                value: "2.webp",
            },
            {
                display_type: 'image',
                trait_type: "3.webp",
                value: "3.webp",
            },
            {
                display_type: 'image',
                trait_type: "4.webp",
                value: "4.webp",
            },
            {
                display_type: 'image',
                trait_type: "5.webp",
                value: "5.webp",
            },
            {
                display_type: "radio-image",
                trait_type: "Color",
                value: {
                    label: "Graphite",
                    src: "graypattern.png"
                }
            },
            {
                display_type: "radio-button",
                trait_type: "Size",
                value: "45MM"
            },
            {
                display_type: "radio-button",
                trait_type: "Edition",
                value: "Standard"
            },
            {
                display_type: "switch",
                trait_type: "Solar",
                value: false,
            }
        ],
        collection_id: "Instinct®"
    },
    {
        id: "",
        name: "GARMIN Instinct® 2 - Camo Edition",
        categories: ['watches', 'sporting', 'fitness-equipment', 'fashion-mens'],
        description: `This rugged GPS smartwatch is tough enough to keep up with you and unique enough to fit your style. Now it comes in two sizes to fit every wrist.This rugged watch is water-rated to 100 meters and is thermal and shock resistant. Plus, with a fiber-reinforced polymer case and chemically strengthened scratch-resistant lens, this device is built to endure.`,
        image: "camo.webp",
        attributes: [
            {
                display_type: 'image',
                trait_type: "camo2.webp",
                value: "camo2.webp",
            },
            {
                display_type: 'image',
                trait_type: "camo3.webp",
                value: "camo3.webp",
            },
            {
                display_type: 'image',
                trait_type: "camo4.webp",
                value: "camo4.webp",
            },
            {
                display_type: "radio-image",
                trait_type: "Color",
                value: {
                    label: "Graphite Camo",
                    src: "camopattern.png"
                }
            },
            {
                display_type: "radio-button",
                trait_type: "Size",
                value: "45MM"
            },
            {
                display_type: "radio-button",
                trait_type: "Edition",
                value: "Camo"
            },
            {
                display_type: "switch",
                trait_type: "Solar",
                value: false,
            }
        ],
        collection_id: "Instinct®"
    },
    {
        id: "",
        name: "Instinct® 2S Solar",
        categories: ['watches', 'sporting', 'fitness-equipment', 'fashion-mens'],
        description: `This rugged GPS smartwatch is tough enough to keep up with you and unique enough to fit your style. Now it comes in two sizes to fit every wrist.This rugged watch is water-rated to 100 meters and is thermal and shock resistant. Plus, with a fiber-reinforced polymer case and chemically strengthened scratch-resistant lens, this device is built to endure.`,
        image: "1.webp",
        attributes: [
            {
                display_type: 'image',
                trait_type: "2.webp",
                value: "2.webp",
            },
            {
                display_type: 'image',
                trait_type: "3.webp",
                value: "3.webp",
            },
            {
                display_type: 'image',
                trait_type: "4.webp",
                value: "4.webp",
            },
            {
                display_type: 'image',
                trait_type: "5.webp",
                value: "5.webp",
            },
            {
                display_type: "radio-image",
                trait_type: "Color",
                value: {
                    label: "Graphite",
                    src: "graypattern.png"
                }
            },
            {
                display_type: "radio-button",
                trait_type: "Size",
                value: "40MM"
            },
            {
                display_type: "radio-button",
                trait_type: "Edition",
                value: "Standard"
            },
            {
                display_type: "switch",
                trait_type: "Solar",
                value: true,
            }
        ],
        collection_id: "Instinct®"
    },
    {
        id: "",
        name: "GARMIN Instinct® 2S Solar",
        categories: ['watches', 'sporting', 'fitness-equipment', 'fashion-mens'],
        description: `This rugged GPS smartwatch is tough enough to keep up with you and unique enough to fit your style. Now it comes in two sizes to fit every wrist.This rugged watch is water-rated to 100 meters and is thermal and shock resistant. Plus, with a fiber-reinforced polymer case and chemically strengthened scratch-resistant lens, this device is built to endure.`,
        image: "white.webp",
        attributes: [
            {
                display_type: 'image',
                trait_type: "white2.webp",
                value: "white2.webp",
            },
            {
                display_type: 'image',
                trait_type: "white3.webp",
                value: "white3.webp",
            },
            {
                display_type: "radio-image",
                trait_type: "Color",
                value: {
                    label: "Mist Gray",
                    src: "whitepattern.png"
                }
            },
            {
                display_type: "radio-button",
                trait_type: "Size",
                value: "45MM"
            },
            {
                display_type: "radio-button",
                trait_type: "Edition",
                value: "Standard"
            },
            {
                display_type: "switch",
                trait_type: "Solar",
                value: true,
            }
        ],
        collection_id: "Instinct®"
    },
    {
        id: "",
        name: "GARMIN Instinct® 2X Solar",
        categories: ['watches', 'sporting', 'fitness-equipment', 'fashion-mens'],
        description: `This rugged GPS smartwatch is tough enough to keep up with you and unique enough to fit your style. Now it comes in two sizes to fit every wrist.This rugged watch is water-rated to 100 meters and is thermal and shock resistant. Plus, with a fiber-reinforced polymer case and chemically strengthened scratch-resistant lens, this device is built to endure.`,
        image: "red.webp",
        attributes: [
            {
                display_type: 'image',
                trait_type: "red2.webp",
                value: "red2.webp",
            },
            {
                display_type: 'image',
                trait_type: "red3.webp",
                value: "red3.webp",
            },
            {
                display_type: 'image',
                trait_type: "red4.webp",
                value: "red4.webp",
            },
            {
                display_type: "radio-image",
                trait_type: "Color",
                value: {
                    label: "Flame Red",
                    src: "redpattern.png"
                }
            },
            {
                display_type: "radio-button",
                trait_type: "Size",
                value: "50MM"
            },
            {
                display_type: "radio-button",
                trait_type: "Edition",
                value: "Standard"
            },
            {
                display_type: "switch",
                trait_type: "Solar",
                value: true,
            }
        ],
        collection_id: "Instinct®"
    },
    {
        id: "",
        name: "BURBERRY Frog Cotton T-shirt",
        categories: ['fashion-mens', 'clothing'],
        description: `A T-shirt in midweight cotton jersey printed with a seasonal frog graphic and Burberry lettering in a puddle effect. The style is cut to a regular fit. \n - Rib-knit neckline\n- Regular fit. Fits true to size, take your normal size.\n- Machine wash`,
        image: "tshirtb1.webp",
        attributes: [
            {
                display_type: 'image',
                trait_type: "tshirtb2.webp",
                value: "tshirt2.webp",
            },
            {
                display_type: 'image',
                trait_type: "tshirtb3.webp",
                value: "tshirt3.webp",
            },
            {
                display_type: "color",
                trait_type: "Color",
                value: {
                    label: "Knight",
                    color: "#013585ff"
                }
            },
            {
                display_type: 'select',
                trait_type: "Size",
                value: "S"
            },
        ],
        collection_id: "Frog Cotton T-shirt"
    },
    {
        id: "",
        name: "BURBERRY Frog Cotton T-shirt",
        categories: ['fashion-mens', 'clothing'],
        description: `A T-shirt in midweight cotton jersey printed with a seasonal frog graphic and Burberry lettering in a puddle effect. The style is cut to a regular fit. \n - Rib-knit neckline\n- Regular fit. Fits true to size, take your normal size.\n- Machine wash`,
        image: "tshirtb1.webp",
        attributes: [
            {
                display_type: 'image',
                trait_type: "tshirtb2.webp",
                value: "tshirt2.webp",
            },
            {
                display_type: 'image',
                trait_type: "tshirtb3.webp",
                value: "tshirt3.webp",
            },
            {
                display_type: "color",
                trait_type: "Color",
                value: {
                    label: "Knight",
                    color: "#013585ff"
                }
            },
            {
                display_type: 'select',
                trait_type: "Size",
                value: "M"
            },
        ],
        collection_id: "Frog Cotton T-shirt"
    },
    {
        id: "",
        name: "BURBERRY Frog Cotton T-shirt",
        categories: ['fashion-mens', 'clothing'],
        description: `A T-shirt in midweight cotton jersey printed with a seasonal frog graphic and Burberry lettering in a puddle effect. The style is cut to a regular fit. \n - Rib-knit neckline\n- Regular fit. Fits true to size, take your normal size.\n- Machine wash`,
        image: "tshirtb1.webp",
        attributes: [
            {
                display_type: 'image',
                trait_type: "tshirtb2.webp",
                value: "tshirt2.webp",
            },
            {
                display_type: 'image',
                trait_type: "tshirtb3.webp",
                value: "tshirt3.webp",
            },
            {
                display_type: "color",
                trait_type: "Color",
                value: {
                    label: "Knight",
                    color: "#013585ff"
                }
            },
            {
                display_type: 'select',
                trait_type: "Size",
                value: "L"
            },
        ],
        collection_id: "Frog Cotton T-shirt"
    },
    {
        id: "",
        name: "BURBERRY Frog Cotton T-shirt",
        categories: ['fashion-mens', 'clothing'],
        description: `A T-shirt in midweight cotton jersey printed with a seasonal frog graphic and Burberry lettering in a puddle effect. The style is cut to a regular fit. \n - Rib-knit neckline\n- Regular fit. Fits true to size, take your normal size.\n- Machine wash`,
        image: "tshirtb1.webp",
        attributes: [
            {
                display_type: 'image',
                trait_type: "tshirtb2.webp",
                value: "tshirt2.webp",
            },
            {
                display_type: 'image',
                trait_type: "tshirtb3.webp",
                value: "tshirt3.webp",
            },
            {
                display_type: "color",
                trait_type: "Color",
                value: {
                    label: "Knight",
                    color: "#013585ff"
                }
            },
            {
                display_type: 'select',
                trait_type: "Size",
                value: "XL"
            },
        ],
        collection_id: "Frog Cotton T-shirt"
    },
    {
        id: "",
        name: "BURBERRY Frog Cotton T-shirt",
        categories: ['fashion-mens', 'clothing'],
        description: `A T-shirt in midweight cotton jersey printed with a seasonal frog graphic and Burberry lettering in a puddle effect. The style is cut to a regular fit. \n - Rib-knit neckline\n- Regular fit. Fits true to size, take your normal size.\n- Machine wash`,
        image: "tshirtb1.webp",
        attributes: [
            {
                display_type: 'image',
                trait_type: "tshirtb2.webp",
                value: "tshirt2.webp",
            },
            {
                display_type: 'image',
                trait_type: "tshirtb3.webp",
                value: "tshirt3.webp",
            },
            {
                display_type: "color",
                trait_type: "Color",
                value: {
                    label: "Knight",
                    color: "#013585ff"
                }
            },
            {
                display_type: 'select',
                trait_type: "Size",
                value: "XXL"
            },
        ],
        collection_id: "Frog Cotton T-shirt"
    },
    {
        id: "",
        name: "BURBERRY Frog Cotton T-shirt",
        categories: ['fashion-mens', 'clothing'],
        description: `A T-shirt in midweight cotton jersey printed with a seasonal frog graphic and Burberry lettering in a puddle effect. The style is cut to a regular fit. \n - Rib-knit neckline\n- Regular fit. Fits true to size, take your normal size.\n- Machine wash`,
        image: "tshirt.webp",
        attributes: [
            {
                display_type: 'image',
                trait_type: "tshirt2.webp",
                value: "tshirt2.webp",
            },
            {
                display_type: 'image',
                trait_type: "tshirt3.webp",
                value: "tshirt3.webp",
            },
            {
                display_type: "color",
                trait_type: "Color",
                value: {
                    label: "Salt",
                    color: "#e7e5e1ff"
                }
            },
            {
                display_type: 'select',
                trait_type: "Size",
                value: "S"
            },
        ],
        collection_id: "Frog Cotton T-shirt"
    },
    {
        id: "",
        name: "BURBERRY Frog Cotton T-shirt",
        categories: ['fashion-mens', 'clothing'],
        description: `A T-shirt in midweight cotton jersey printed with a seasonal frog graphic and Burberry lettering in a puddle effect. The style is cut to a regular fit. \n - Rib-knit neckline\n- Regular fit. Fits true to size, take your normal size.\n- Machine wash`,
        image: "tshirt.webp",
        attributes: [
            {
                display_type: 'image',
                trait_type: "tshirt2.webp",
                value: "tshirt2.webp",
            },
            {
                display_type: 'image',
                trait_type: "tshirt3.webp",
                value: "tshirt3.webp",
            },
            {
                display_type: "color",
                trait_type: "Color",
                value: {
                    label: "Salt",
                    color: "#e7e5e1ff"
                }
            },
            {
                display_type: 'select',
                trait_type: "Size",
                value: "M"
            },
        ],
        collection_id: "Frog Cotton T-shirt"
    },
    {
        id: "",
        name: "BURBERRY Frog Cotton T-shirt",
        categories: ['fashion-mens', 'clothing'],
        description: `A T-shirt in midweight cotton jersey printed with a seasonal frog graphic and Burberry lettering in a puddle effect. The style is cut to a regular fit. \n - Rib-knit neckline\n- Regular fit. Fits true to size, take your normal size.\n- Machine wash`,
        image: "tshirt.webp",
        attributes: [
            {
                display_type: 'image',
                trait_type: "tshirt2.webp",
                value: "tshirt2.webp",
            },
            {
                display_type: 'image',
                trait_type: "tshirt3.webp",
                value: "tshirt3.webp",
            },
            {
                display_type: "color",
                trait_type: "Color",
                value: {
                    label: "Salt",
                    color: "#e7e5e1ff"
                }
            },
            {
                display_type: 'select',
                trait_type: "Size",
                value: "L"
            },
        ],
        collection_id: "Frog Cotton T-shirt"
    },
    {
        id: "",
        name: "BURBERRY Frog Cotton T-shirt",
        categories: ['fashion-mens', 'clothing'],
        description: `A T-shirt in midweight cotton jersey printed with a seasonal frog graphic and Burberry lettering in a puddle effect. The style is cut to a regular fit. \n - Rib-knit neckline\n- Regular fit. Fits true to size, take your normal size.\n- Machine wash`,
        image: "tshirt.webp",
        attributes: [
            {
                display_type: 'image',
                trait_type: "tshirt2.webp",
                value: "tshirt2.webp",
            },
            {
                display_type: 'image',
                trait_type: "tshirt3.webp",
                value: "tshirt3.webp",
            },
            {
                display_type: "color",
                trait_type: "Color",
                value: {
                    label: "Salt",
                    color: "#e7e5e1ff"
                }
            },
            {
                display_type: 'select',
                trait_type: "Size",
                value: "XL"
            },
        ],
        collection_id: "Frog Cotton T-shirt"
    },
    {
        id: "",
        name: "BURBERRY Frog Cotton T-shirt",
        categories: ['fashion-mens', 'clothing'],
        description: `A T-shirt in midweight cotton jersey printed with a seasonal frog graphic and Burberry lettering in a puddle effect. The style is cut to a regular fit. \n - Rib-knit neckline\n- Regular fit. Fits true to size, take your normal size.\n- Machine wash`,
        image: "tshirt.webp",
        attributes: [
            {
                display_type: 'image',
                trait_type: "tshirt2.webp",
                value: "tshirt2.webp",
            },
            {
                display_type: 'image',
                trait_type: "tshirt3.webp",
                value: "tshirt3.webp",
            },
            {
                display_type: "color",
                trait_type: "Color",
                value: {
                   label: "Salt",
                    color: "#e7e5e1ff"
                }
            },
            {
                display_type: 'select',
                trait_type: "Size",
                value: "XXL"
            },
        ],
        collection_id: "Frog Cotton T-shirt"
    },
    {
        id: "",
        name: "HARIBO Smurf Sour Gummies",
        categories: ['snacks', 'grocery'],
        description: `Enjoy a tangy twist on a beloved treat with Haribo Smurfs Sour! These fun, sour gummy candies are shaped like the iconic Smurfs characters and pack a punch of fruity sourness. Perfect for fans of both the Smurfs and sour flavors, they’re great for snacking, sharing, or adding a playful touch to any occasion. Dive into the delightful sourness of Haribo Smurfs Sour for a fun and tasty experience!`,
        image: "haribo1.webp",
        attributes: [
            {
                display_type: 'image',
                trait_type: "haribo2.webp",
                value: "haribo2.webp",
            },
            {
                display_type: 'radio-button',
                trait_type: "Size",
                value: "120g"
            },
            {
                display_type: 'radio-button',
                trait_type: "Kind",
                value: "Smurf Sour"
            },
        ],
        collection_id: "HARIBO"
    },
    {
        id: "",
        name: "HARIBO Smurf Sour Gummies",
        categories: ['snacks', 'grocery'],
        description: `Enjoy a tangy twist on a beloved treat with Haribo Smurfs Sour! These fun, sour gummy candies are shaped like the iconic Smurfs characters and pack a punch of fruity sourness. Perfect for fans of both the Smurfs and sour flavors, they’re great for snacking, sharing, or adding a playful touch to any occasion. Dive into the delightful sourness of Haribo Smurfs Sour for a fun and tasty experience!`,
        image: "haribo1.webp",
        attributes: [
            {
                display_type: 'image',
                trait_type: "haribo2.webp",
                value: "haribo2.webp",
            },
            {
                display_type: 'radio-button',
                trait_type: "Size",
                value: "220g"
            },
            {
                display_type: 'radio-button',
                trait_type: "Kind",
                value: "Smurf Sour"
            },
        ],
        collection_id: "HARIBO"
    },
    {
        id: "",
        name: "HARIBO Happy-Cola Gummies",
        categories: ['snacks', 'grocery'],
        description: `Happy-Cola gummies with sour, sweet, and tangy coating, Naturally flavored with balanced sweetness, Mouth watering candy and are fat-free`,
        image: "haribo3.webp",
        attributes: [
            {
                display_type: 'image',
                trait_type: "haribo4.webp",
                value: "haribo4.webp",
            },
            {
                display_type: 'radio-button',
                trait_type: "Size",
                value: "220g"
            },
            {
                display_type: 'radio-button',
                trait_type: "Kind",
                value: "Happy Cola"
            },
        ],
        collection_id: "HARIBO"
    },
] as const;




const uploadAndApplyImages = async (p: ProductMetaData) => {
    let imgs = [p.image];
    type Att<T extends ProductMetaData['attributes'][number]['display_type']> = ProductMetaData['attributes'][number] & { display_type: T };

    imgs.push(...p.attributes.filter(e => e.display_type === 'image').map((e) => (e as Att<'image'>).value!));
    imgs.push(...p.attributes.filter(e => e.display_type === 'radio-image').map((e) => (e as Att<'radio-image'>).value!.src));
    imgs = imgs.filter(i => !imgsMap.has(i))
    const toUpload = await Promise.all(imgs.map(async i => {
        return new File([await Bun.file(`scripts/testImages/${i}`).arrayBuffer()], `${i}`, { type: `image/${i.split('.')[1]}` });
    }))
    if (toUpload.length > 0) {
        const resp = await api.filesUpload(toUpload);
        resp.forEach((e, i) => {
            imgsMap.set(imgs[i], e);
        });
    }

    p.image = imgsMap.get(p.image)!;

    p.attributes.filter(e => e.display_type === 'image').forEach(a => {
        let at = a as Att<'image'>;
        at.value = imgsMap.get(at.value!);
    })
    p.attributes.filter(e => e.display_type === 'radio-image').forEach(a => {
        let at = a as Att<'radio-image'>;
        at.value!.src = imgsMap.get(at.value?.src!)!;
    })


}
const imgsMap = new Map<string, string>();

type OfLength<A extends {length:number}, X, ACC extends any[]=[]> = ACC['length'] extends A['length'] ? ACC : OfLength<A,X, [...ACC, X]>;
type Mutable<T> = { -readonly [P in keyof T]: Mutable<T[P]> };

const randInt = (min:number, max:number)=>{
    return Math.floor((max - min)*Math.random() + min);
}

export const createTestProducts = async () => {
    const env = loadEnvFile(await Bun.file(`backend/.env.${Bun.env.NODE_ENV}`).text());
    const productPrices:OfLength<typeof products, AssetListBaseForString>  = [
        [{ amount: "1000000000", info: { native: "untrn" } },{ amount: "20000000", info: { cw20: env.CW20_ADDRESS } }],
        [{ amount: "1000000000", info: { native: "untrn" } },{ amount: "20000000", info: { cw20: env.CW20_ADDRESS } }],
        [{ amount: "1000000000", info: { native: "untrn" } },{ amount: "20000000", info: { cw20: env.CW20_ADDRESS } }],
        [{ amount: "1000000000", info: { native: "untrn" } },{ amount: "20000000", info: { cw20: env.CW20_ADDRESS } }],
        [{ amount: "1000000000", info: { native: "untrn" } },{ amount: "20000000", info: { cw20: env.CW20_ADDRESS } }],
        [{ amount: "1000000000", info: { native: "untrn" } },{ amount: "20000000", info: { cw20: env.CW20_ADDRESS } }],
        [{ amount: "1000000000", info: { native: "untrn" } },{ amount: "20000000", info: { cw20: env.CW20_ADDRESS } }],
        [{ amount: "1000000000", info: { native: "untrn" } },{ amount: "20000000", info: { cw20: env.CW20_ADDRESS } }],
        [{ amount: "1000000000", info: { native: "untrn" } },{ amount: "20000000", info: { cw20: env.CW20_ADDRESS } }],
        [{ amount: "1000000000", info: { native: "untrn" } },{ amount: "20000000", info: { cw20: env.CW20_ADDRESS } }],
        [{ amount: "1000000000", info: { native: "untrn" } },{ amount: "20000000", info: { cw20: env.CW20_ADDRESS } }],
        [{ amount: "1000000000", info: { native: "untrn" } },{ amount: "20000000", info: { cw20: env.CW20_ADDRESS } }],
        [{ amount: "1000000000", info: { native: "untrn" } },{ amount: "20000000", info: { cw20: env.CW20_ADDRESS } }],
        [{ amount: "1000000000", info: { native: "untrn" } },{ amount: "20000000", info: { cw20: env.CW20_ADDRESS } }],
        [{ amount: "1000000000", info: { native: "untrn" } },{ amount: "20000000", info: { cw20: env.CW20_ADDRESS } }],
        [{ amount: "1000000000", info: { native: "untrn" } },{ amount: "20000000", info: { cw20: env.CW20_ADDRESS } }],
        [{ amount: "1000000000", info: { native: "untrn" } },{ amount: "20000000", info: { cw20: env.CW20_ADDRESS } }],
        [{ amount: "1000000000", info: { native: "untrn" } },{ amount: "20000000", info: { cw20: env.CW20_ADDRESS } }],
        [{ amount: "1000000000", info: { native: "untrn" } },{ amount: "20000000", info: { cw20: env.CW20_ADDRESS } }],
        [{ amount: "1000000000", info: { native: "untrn" } },{ amount: "20000000", info: { cw20: env.CW20_ADDRESS } }],
        [{ amount: "1000000000", info: { native: "untrn" } },{ amount: "20000000", info: { cw20: env.CW20_ADDRESS } }],
    ]
    let adminClient = await Secp256k1HdWallet.fromMnemonic(MNEMONIC_1, {
        prefix: "neutron",
    });
    let adminAddress = (await adminClient.getAccounts())[0].address;
    const signer = await SigningCosmWasmClient.connectWithSigner(ENDPOINT, adminClient, {
        gasPrice: GasPrice.fromString("25untrn"),
    });
    const client = new EmporionClient(signer, adminAddress, env.STORE_ADDRESS);

    const { nonce } = (await api.nonce(adminAddress));
    const signature = await signMessage(adminClient, adminAddress, nonce);
    const { token } = (await api.requestJWT(signature, nonce, adminAddress));
    api.setToken(token);
    let i = 0;
    for await (const m of products) {
        let meta = m as unknown as ProductMetaData;
        await uploadAndApplyImages(meta);
        const hash = productMetaHash(meta);
        const req = await client.create_product({
            price: productPrices[i],
            delivery_time: {
                time: 86400 * randInt(1, 30)
            },
            is_listed: true,
            meta: `http://localhost:3000/hash/${hash}`,
            meta_hash: hash,
        }, 'auto')

        const pId = extractAttr('product_id', req)!;
        meta.id = pId;
        await api.metaUpload(meta);
        i++;
    }
}

createTestProducts()