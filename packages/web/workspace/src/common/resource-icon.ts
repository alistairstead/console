import {
  IconApi,
  IconApiGatewayV1Api,
  IconAppSync,
  IconAstroSite,
  IconAuth,
  IconBucket,
  IconCognito,
  IconCron,
  IconEventBus,
  IconFunction,
  IconJob,
  IconKinesisStream,
  IconNextjsSite,
  IconQueue,
  IconRDS,
  IconRemixSite,
  IconScript,
  IconSolidStartSite,
  IconStack,
  IconStaticSite,
  IconSvelteKitSite,
  IconTable,
  IconTopic,
  IconWebSocketApi,
} from "$/ui/icons/custom";
import { JSX } from "solid-js";
import type { Resource } from "@console/core/app/resource";

export const ResourceIcon = {
  Api: IconApi,
  Job: IconJob,
  RDS: IconRDS,
  Auth: IconAuth,
  Cron: IconCron,
  Queue: IconQueue,
  Stack: IconStack,
  Table: IconTable,
  Topic: IconTopic,
  Bucket: IconBucket,
  Script: IconScript,
  AppSync: IconAppSync,
  Cognito: IconCognito,
  EventBus: IconEventBus,
  Function: IconFunction,
  AstroSite: IconAstroSite,
  RemixSite: IconRemixSite,
  NextjsSite: IconNextjsSite,
  StaticSite: IconStaticSite,
  SlsNextjsSite: IconNextjsSite,
  WebSocketApi: IconWebSocketApi,
  KinesisStream: IconKinesisStream,
  SvelteKitSite: IconSvelteKitSite,
  SolidStartSite: IconSolidStartSite,
  ApiGatewayV1Api: IconApiGatewayV1Api,
  Service: IconFunction,
} satisfies Record<Resource.Info["type"], (props: any) => JSX.Element>;
