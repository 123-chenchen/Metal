import { MedusaContainer } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createApiKeysWorkflow,
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
          payment_providers: ["pp_system_default"],
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
}
