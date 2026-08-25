import { MedusaContainer } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createApiKeysWorkflow,
  createCollectionsWorkflow,
  createProductCategoriesWorkflow,
  createProductOptionsWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createStockLocationsWorkflow,
  createStoresWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows";

export default async function initial_data_seed({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(
    ModuleRegistrationName.FULFILLMENT
  );

  const countries = ["vn"];

  logger.info("Seeding store data...");
  const {
    result: [defaultSalesChannel],
  } = await createSalesChannelsWorkflow(container).run({
    input: {
      salesChannelsData: [
        {
          name: "Default Sales Channel",
          description: "Created by Medusa",
        },
      ],
    },
  });

  const {
    result: [publishableApiKey],
  } = await createApiKeysWorkflow(container).run({
    input: {
      api_keys: [
        {
          title: "Default Publishable API Key",
          type: "publishable",
          created_by: "",
        },
      ],
    },
  });

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: publishableApiKey.id,
      add: [defaultSalesChannel.id],
    },
  });

  const {
    result: [store],
  } = await createStoresWorkflow(container).run({
    input: {
      stores: [
        {
          name: "Default Store",
          supported_currencies: [
            {
              currency_code: "vnd",
              is_default: true,
            },
            {
              currency_code: "usd",
              is_default: false,
            },
          ],
          default_sales_channel_id: defaultSalesChannel.id,
        },
      ],
    },
  });

  logger.info("Seeding region data...");
  const { result: regionResult } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "Vietnam",
          currency_code: "vnd",
          countries,
          // "pp_sepay_sepay" is Medusa's derived id for the sepay module
          // provider (config id "sepay" + AbstractPaymentProvider identifier
          // "sepay") registered in medusa-config.ts. Without it in a
          // region's payment_providers, the storefront's SePay QR checkout
          // option (see lib/constants.tsx paymentInfoMap) never appears.
          payment_providers: ["pp_system_default", "pp_sepay_sepay"],
        },
      ],
    },
  });
  const region = regionResult[0];
  logger.info("Finished seeding regions.");

  logger.info("Seeding tax regions...");
  await createTaxRegionsWorkflow(container).run({
    input: countries.map((country_code) => ({
      country_code,
      provider_id: "tp_system",
    })),
  });
  logger.info("Finished seeding tax regions.");

  logger.info("Seeding stock location data...");
  const { result: stockLocationResult } = await createStockLocationsWorkflow(
    container
  ).run({
    input: {
      locations: [
        {
          name: "Vietnam Warehouse",
          address: {
            city: "Ho Chi Minh City",
            country_code: "VN",
            address_1: "",
          },
        },
      ],
    },
  });
  const stockLocation = stockLocationResult[0];

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_provider_id: "manual_manual",
    },
  });

  logger.info("Seeding fulfillment data...");
  // This is created by a migration script in core.
  const { data: shippingProfileResult } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  });
  const shippingProfile = shippingProfileResult[0];

  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: "Vietnam Warehouse delivery",
    type: "shipping",
    service_zones: [
      {
        name: "Vietnam",
        geo_zones: [
          {
            country_code: "vn",
            type: "country",
          },
        ],
      },
    ],
  });

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_set_id: fulfillmentSet.id,
    },
  });

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Standard Shipping",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Standard",
          description: "Ship in 2-3 days.",
          code: "standard",
        },
        prices: [
          {
            currency_code: "usd",
            amount: 1,
          },
          {
            currency_code: "vnd",
            amount: 20000,
          },
          {
            region_id: region.id,
            amount: 20000,
          },
        ],
        rules: [
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq",
          },
          {
            attribute: "is_return",
            value: "false",
            operator: "eq",
          },
        ],
      },
      {
        name: "Express Shipping",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Express",
          description: "Ship in 24 hours.",
          code: "express",
        },
        prices: [
          {
            currency_code: "usd",
            amount: 2,
          },
          {
            currency_code: "vnd",
            amount: 40000,
          },
          {
            region_id: region.id,
            amount: 40000,
          },
        ],
        rules: [
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq",
          },
          {
            attribute: "is_return",
            value: "false",
            operator: "eq",
          },
        ],
      },
    ],
  });
  logger.info("Finished seeding fulfillment data.");

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [defaultSalesChannel.id],
    },
  });
  logger.info("Finished seeding stock location data.");

  logger.info("Seeding product category data...");

  await createProductCategoriesWorkflow(container).run({
    input: {
      product_categories: [
        {
          name: "Anime",
          is_active: true,
        },
        {
          name: "Gaming",
          is_active: true,
        },
        {
          name: "Sports",
          is_active: true,
        },
        {
          name: "Demon Slayer",
          is_active: true,
        },
        {
          name: "Naruto",
          is_active: true,
        },
        {
          name: "One Piece",
          is_active: true,
        },
        {
          name: "Jujutsu Kaisen",
          is_active: true,
        },
        {
          name: "Dragon Ball",
          is_active: true,
        },
        {
          name: "Pokemon",
          is_active: true,
        },
        {
          name: "Hunter x Hunter",
          is_active: true,
        },
      ],
    },
  });
  logger.info("Finished seeding product category data.");

  // The Explore mega menu's "Collections" section (see
  // modules/layout/components/mega-menu/config.ts) hardcodes these two
  // handles — without them the section renders empty on a fresh database.
  logger.info("Seeding product collection data...");

  const { result: collectionsResult } = await createCollectionsWorkflow(
    container
  ).run({
    input: {
      collections: [
        {
          title: "Poke Framium Square",
          handle: "poke-framium-square",
        },
        {
          title: "Poke Framium Hexagonal",
          handle: "poke-framium-hexagonal",
        },
      ],
    },
  });
  const squareCollection = collectionsResult.find(
    (c) => c.handle === "poke-framium-square"
  )!;
  const hexagonalCollection = collectionsResult.find(
    (c) => c.handle === "poke-framium-hexagonal"
  )!;
  logger.info("Finished seeding product collection data.");

  // The Custom Standard/Hexagon poster pages (see modules/custom) resolve
  // their backing product by these exact handles — without them, those
  // pages 404 on a fresh database.
  logger.info("Seeding custom poster products...");

  const { result: productOptionsResult } = await createProductOptionsWorkflow(
    container
  ).run({
    input: {
      product_options: [
        {
          title: "Hexagon Size",
          values: ["One Size"],
        },
        {
          title: "Standard Size",
          values: ["S", "M", "L", "XL"],
        },
      ],
    },
  });
  const hexagonSizeOption = productOptionsResult.find(
    (o) => o.title === "Hexagon Size"
  )!;
  const standardSizeOption = productOptionsResult.find(
    (o) => o.title === "Standard Size"
  )!;

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: "Hexagon Metal Posters",
          handle: "hexagon-metal-posters",
          description: "Custom hexagon metal poster.",
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          options: [{ id: hexagonSizeOption.id }],
          variants: [
            {
              title: "One Size",
              options: {
                "Hexagon Size": "One Size",
              },
              prices: [
                {
                  amount: 250000,
                  currency_code: "vnd",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel.id,
            },
          ],
        },
        {
          title: "Standard Metal Posters",
          handle: "standard-metal-posters",
          description: "Custom standard metal poster.",
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          options: [{ id: standardSizeOption.id }],
          variants: [
            {
              title: "S",
              options: { "Standard Size": "S" },
              prices: [{ amount: 100000, currency_code: "vnd" }],
            },
            {
              title: "M",
              options: { "Standard Size": "M" },
              prices: [{ amount: 200000, currency_code: "vnd" }],
            },
            {
              title: "L",
              options: { "Standard Size": "L" },
              prices: [{ amount: 300000, currency_code: "vnd" }],
            },
            {
              title: "XL",
              options: { "Standard Size": "XL" },
              prices: [{ amount: 400000, currency_code: "vnd" }],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel.id,
            },
          ],
        },
      ],
    },
  });
  logger.info("Finished seeding custom poster products.");

  // These mirror the two catalog products already built and image-stocked
  // in the shared dev database (uploaded to the R2 bucket configured in
  // medusa-config.ts) so every engineer's local seed shows the same
  // pre-made Pokemon design catalog instead of an empty collection.
  logger.info("Seeding Poke Framium catalog products...");

  const pokeHexagonalImages = [
    "https://pub-5cd34cd23bb54fd2bb0b6656730440b7.r2.dev/productsPOKE%20Framium%20-%20L%C3%A1%C2%BB%C2%A5c%20gi%C3%83%C2%A1c%20-%20Pokemon%20-%20Flareon%20170_167-01M07ZP0HRGW2QF052DK2TXV03.png",
    "https://pub-5cd34cd23bb54fd2bb0b6656730440b7.r2.dev/productsPOKE%20Framium%20-%20L%C3%A1%C2%BB%C2%A5c%20gi%C3%83%C2%A1c%20-%20Pokemon%20-%20Oshawott%20105_086-01M07ZP0JANFVAQMZQR30DE777.png",
    "https://pub-5cd34cd23bb54fd2bb0b6656730440b7.r2.dev/productsPOKE%20Framium%20-%20L%C3%A1%C2%BB%C2%A5c%20gi%C3%83%C2%A1c%20-%20Pokemon%20-%20Rayquaza%20VMAX%20EVS%20218_203-01M07ZP0JPKV5M5WYM5NPWE29W.png",
    "https://pub-5cd34cd23bb54fd2bb0b6656730440b7.r2.dev/productsPOKE%20Framium%20-%20L%C3%A1%C2%BB%C2%A5c%20gi%C3%83%C2%A1c%20-%20Pokemon%20-%20Umbreon%20VMAX%20EVS%20095_203%20(2)-01M07ZP0K1YTFAF0HFAH33MMDK.png",
    "https://pub-5cd34cd23bb54fd2bb0b6656730440b7.r2.dev/productsPOKE%20Framium%20-%20L%C3%A1%C2%BB%C2%A5c%20gi%C3%83%C2%A1c%20-%20Pokemon%20-%20Zapdos%20%26%20Articuno%20%26%20Moltres%20GX%20SM210-01M07ZP0KEK76ZXRHQMW8C2Y7E.png",
    "https://pub-5cd34cd23bb54fd2bb0b6656730440b7.r2.dev/productsPOKE%20Framium%20-%20L%C3%A1%C2%BB%C2%A5c%20gi%C3%83%C2%A1c%20-%20Misty_s%20Pokemon%20-%20Misty_s%20Psyduck%2070%20HP-01M07ZP0KR2M5YMH6Q1ZHMFN86.png",
  ]
  const pokeSquareImages = [
    "https://pub-5cd34cd23bb54fd2bb0b6656730440b7.r2.dev/productsPOKE%20Framium%20-%20KHUNG%20VU%C3%83%C2%94NG%20-%20Pokemon%20%20-%20Pikachu%2070%20HP-01M07ZVKBSR5FZPSZDW0RKSXE5.png",
    "https://pub-5cd34cd23bb54fd2bb0b6656730440b7.r2.dev/productsPOKE%20Framium%20-%20KHUNG%20VU%C3%83%C2%94NG%20-%20Pokemon%20-%20Evaluee%20ex%20200%20HP-01M07ZVKC2Z8T8QNMC16H667VK.png",
    "https://pub-5cd34cd23bb54fd2bb0b6656730440b7.r2.dev/productsPOKE%20Framium%20-%20KHUNG%20VU%C3%83%C2%94NG%20-%20Pokemon%20-%20Groudon%20130%20HP-01M07ZVKCE3GFBCRXB81225NHE.png",
    "https://pub-5cd34cd23bb54fd2bb0b6656730440b7.r2.dev/productsPOKE%20Framium%20-%20KHUNG%20VU%C3%83%C2%94NG%20-%20Pokemon%20-%20Pikachu%20%26%20Zekrom%20GX%20240%20HP%20(2)-01M07ZVKCNH414A76GM9H89C6E.png",
    "https://pub-5cd34cd23bb54fd2bb0b6656730440b7.r2.dev/productsPOKE%20Framium%20-%20KHUNG%20VU%C3%83%C2%94NG%20-%20Pokemon%20-%20Pikachu%20%26%20Zekrom%20GX%20240%20HP-01M07ZVKCTXH7KJVGASXF7DDHW.png",
    "https://pub-5cd34cd23bb54fd2bb0b6656730440b7.r2.dev/productsPOKE%20Framium%20-%20KHUNG%20VU%C3%83%C2%94NG%20-%20Pokemon%20-%20Pikachu%2060%20HP-01M07ZVKD1H6F84CHQQZJ7MBRX.png",
  ]

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: "Poke Framium Hexagonal",
          handle: "poke-framium-hexagonal",
          description: "Pre-designed Pokemon hexagon metal poster.",
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          collection_id: hexagonalCollection.id,
          thumbnail: pokeHexagonalImages[0],
          images: pokeHexagonalImages.map((url) => ({ url })),
          options: [{ title: "Poke Hex", values: ["18*15.6*9"] }],
          variants: [
            {
              title: "18*15.6*9",
              options: { "Poke Hex": "18*15.6*9" },
              prices: [{ amount: 250000, currency_code: "vnd" }],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel.id,
            },
          ],
        },
        {
          title: "Poke Framium Square",
          handle: "poke-framium-square",
          description: "Pre-designed Pokemon square metal poster.",
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          collection_id: squareCollection.id,
          thumbnail: pokeSquareImages[0],
          images: pokeSquareImages.map((url) => ({ url })),
          options: [{ title: "Poke Square", values: ["20x20"] }],
          variants: [
            {
              title: "20x20",
              options: { "Poke Square": "20x20" },
              prices: [{ amount: 350000, currency_code: "vnd" }],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel.id,
            },
          ],
        },
      ],
    },
  });
  logger.info("Finished seeding Poke Framium catalog products.");
}
