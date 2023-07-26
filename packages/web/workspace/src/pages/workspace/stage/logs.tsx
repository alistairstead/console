import { LogStore, clearLogStore } from "$/data/log";
import { LogPollerStore } from "$/data/log-poller";
import { createSubscription, useReplicache } from "$/providers/replicache";
import { Tag, Text, Select } from "$/ui";
import {
  Dropdown as Dropdown2,
  DropdownOption,
  DropdownDivider,
} from "../../design";
import { Dropdown } from "$/ui/dropdown";
import {
  IconBookmark,
  IconArrowPath,
  IconArrowDown,
  IconBoltSolid,
  IconCommandLine,
  IconArrowsUpDown,
  IconChevronUpDown,
  IconMagnifyingGlass,
} from "$/ui/icons";
import {
  IconFunction,
  IconCaretRight,
  IconArrowPathSpin,
  IconCaretRightOutline,
} from "$/ui/icons/custom";
import { Row, Stack } from "$/ui/layout";
import { Button, LinkButton, TextButton, IconButton } from "$/ui/button";
import { theme } from "$/ui/theme";
import { utility } from "$/ui/utility";
import { globalKeyframes, style } from "@macaron-css/core";
import { styled } from "@macaron-css/solid";
import { useNavigate, useParams, useSearchParams } from "@solidjs/router";
import {
  For,
  Match,
  Show,
  Switch,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
} from "solid-js";
import {
  useFunctionsContext,
  useResourcesContext,
  useStageContext,
} from "./context";
import { Resource } from "@console/core/app/resource";
import { DUMMY_LOGS } from "./logs-dummy";
import { useCommandBar } from "../command-bar";
import { IconMap } from "./resources";
import { bus } from "$/providers/bus";
import { createStore, unwrap } from "solid-js/store";
import {
  DialogPayloadSave,
  DialogPayloadSaveControl,
} from "./dialog-payload-save";
import { LambdaPayloadStore } from "$/data/lambda-payload";
import {
  DialogPayloadManage,
  DialogPayloadManageControl,
} from "./dialog-payload-manage";
import { DropdownMenu } from "@kobalte/core";

const LogSwitchIcon = styled("div", {
  base: {
    top: -1,
    width: 18,
    height: 18,
    position: "relative",
    color: theme.color.icon.secondary,
  },
});

const LogList = styled("div", {
  base: {
    border: `1px solid ${theme.color.divider.base}`,
    borderRadius: theme.borderRadius,
  },
});

const LogLoadingIndicator = styled("div", {
  base: {
    ...utility.row(0),
    height: 52,
    alignItems: "center",
    justifyContent: "space-between",
    padding: `0 ${theme.space[3]}`,
  },
});

const LogLoadingIndicatorIcon = styled("div", {
  base: {
    padding: 2,
    width: 20,
    height: 20,
    color: theme.color.text.dimmed.base,
    opacity: theme.iconOpacity,
  },
  variants: {
    pulse: {
      true: {
        animation: "pulse 1.5s linear infinite",
      },
      false: {},
    },
  },
  defaultVariants: {
    pulse: true,
  },
});

const LogClearButton = styled("span", {
  base: {
    lineHeight: "normal",
    fontSize: theme.font.size.sm,
    color: theme.color.text.secondary.base,
    transition: `color ${theme.colorFadeDuration} ease-out`,
    ":hover": {
      color: theme.color.text.primary.base,
    },
  },
});

globalKeyframes("pulse", {
  "0%": {
    opacity: 0.3,
  },
  "50%": {
    opacity: 1,
  },
  "100%": {
    opacity: 0.3,
  },
});

const LogContainer = styled("div", {
  base: {
    borderTop: `1px solid ${theme.color.divider.base}`,
  },
  variants: {
    expanded: {
      true: {},
      false: {},
    },
    level: {
      info: {},
      error: {},
    },
  },
  defaultVariants: {
    expanded: false,
    level: "info",
  },
});

const LogSummary = styled("div", {
  base: {
    ...utility.row(3),
    height: 48,
    fontSize: theme.font.size.mono_sm,
    alignItems: "center",
    padding: `0 ${theme.space[3]}`,
    transition: `opacity ${theme.colorFadeDuration} ease-out`,
  },
  variants: {
    loading: {
      true: {
        opacity: 0.4,
      },
      false: {
        opacity: 1,
      },
    },
  },
});

const InvokeRoot = styled("div", {
  base: {
    ...utility.row(0),
    borderTop: `1px solid ${theme.color.divider.base}`,
    justifyContent: "space-between",
    paddingLeft: theme.space[3],
    alignItems: "center",
    ":focus-within": {},
  },
  variants: {
    expand: {
      true: {
        ...utility.stack(0),
        backgroundColor: theme.color.input.background,
        height: "auto",
        alignItems: "stretch",
        padding: 0,
        paddingBottom: theme.space[3],
        resize: "vertical",
        overflow: "scroll",
        minHeight: 170,
      },
      false: {
        height: 64,
      },
    },
  },
});

const InvokeControls = styled("div", {
  base: {
    ...utility.row(0),
    justifyContent: "space-between",
    padding: `${theme.space[3]} ${theme.space[3]} ${theme.space[3]} ${theme.space[4]}`,
    selectors: {
      [`${InvokeRoot.selector({ expand: true })} &`]: {
        flex: "0 0 auto",
        padding: `${theme.space[3]} ${theme.space[3]} 0 ${theme.space[4]}`,
      },
    },
  },
});

const InvokeControlsLeft = styled("div", {
  base: {
    ...utility.row(3),
    alignItems: "center",
    display: "none",
    selectors: {
      [`${InvokeRoot.selector({ expand: true })} &`]: {
        display: "flex",
      },
    },
  },
});

const InvokeControlsCancel = styled(LinkButton, {
  base: {
    display: "none",
    selectors: {
      [`${InvokeRoot.selector({ expand: true })} &`]: {
        display: "initial",
      },
    },
  },
});

const InvokePayloadLabel = styled("div", {
  base: {
    ...utility.row(2),
    alignItems: "center",
    left: theme.space[3],
    selectors: {
      [`${InvokeRoot.selector({ expand: true })} &`]: {
        display: "none",
      },
    },
  },
});

const InvokePayloadLabelIcon = styled("div", {
  base: {
    width: 20,
    height: 20,
    color: theme.color.icon.dimmed,
  },
});

const InvokeTextArea = styled("textarea", {
  base: {
    display: "none",
    flex: "1 1 auto",
    padding: theme.space[4],
    border: "none",
    resize: "none",
    height: "100%",
    lineHeight: theme.font.lineHeight,
    appearance: "none",
    fontSize: theme.font.size.mono_sm,
    fontFamily: theme.font.family.code,
    background: "transparent",
    selectors: {
      [`${InvokeRoot.selector({ expand: true })} &`]: {
        display: "block",
      },
    },
  },
});

const LogEmpty = styled("div", {
  base: {
    ...utility.stack(4),
    height: 240,
    alignItems: "center",
    justifyContent: "center",
    borderTop: `1px solid ${theme.color.divider.base}`,
  },
});

const LogText = styled("div", {
  base: {
    ...utility.textLine(),
    fontFamily: theme.font.family.code,
  },
});

const LogDate = styled(LogText, {
  base: {
    flexShrink: 0,
    paddingLeft: theme.space[2],
  },
});

const LogDuration = styled(LogText, {
  base: {
    flexShrink: 0,
    minWidth: 70,
    textAlign: "right",
    color: theme.color.text.secondary.base,
  },
  variants: {
    coldStart: {
      true: {
        color: `hsla(${theme.color.base.blue}, 100%)`,
      },
      false: {},
    },
  },
  defaultVariants: {
    coldStart: false,
  },
});

const LogRequestId = styled(LogText, {
  base: {
    paddingLeft: theme.space[2],
    flexShrink: 0,
    lineHeight: "normal",
    color: theme.color.text.secondary.base,
    fontSize: theme.font.size.mono_base,
  },
});

const LogMessage = styled(LogText, {
  base: {
    flexGrow: 1,
    alignSelf: "center",
    lineHeight: "normal",
    paddingLeft: theme.space[2],
    fontSize: theme.font.size.mono_base,
    selectors: {
      [`${LogContainer.selector({ level: "error" })} &`]: {
        color: `hsla(${theme.color.base.red}, 100%)`,
      },
    },
  },
});

const CaretIcon = styled("div", {
  base: {
    width: 20,
    height: 20,
    flexShrink: 0,
    lineHeight: 0,
    color: theme.color.icon.dimmed,
    transition: "transform 0.2s ease-out",
    selectors: {
      [`${LogContainer.selector({ expanded: true })} &`]: {
        transform: "rotate(90deg)",
      },
    },
  },
});

const LogDetail = styled("div", {
  base: {
    padding: theme.space[3],
    ...utility.stack(3),
    selectors: {
      [`${LogContainer.selector({ expanded: true })} &`]: {
        borderTop: `1px solid ${theme.color.divider.base}`,
      },
    },
  },
});

const LogDetailHeader = styled("div", {
  base: {
    display: "flex",
    fontSize: theme.font.size.sm,
    padding: `0 ${theme.space.px}`,
    alignItems: "center",
    justifyContent: "space-between",
  },
});

const LogDetailHeaderTitle = styled("div", {
  base: {
    letterSpacing: 0.5,
    textTransform: "uppercase",
    fontFamily: theme.font.family.heading,
    color: theme.color.text.dimmed.base,
    fontWeight: 500,
    transition: `color ${theme.colorFadeDuration} ease-out`,
    ":hover": {
      color: theme.color.text.secondary.base,
    },
  },
  variants: {
    state: {
      active: {
        color: theme.color.text.primary.base,
        ":hover": {
          color: theme.color.text.primary.base,
        },
      },
      inactive: {},
      disabled: {
        opacity: "0.65",
        ":hover": {
          color: theme.color.text.dimmed.base,
        },
      },
    },
  },
  defaultVariants: {
    state: "inactive",
  },
});

const LogLink = styled("a", {
  base: {},
});

const LogEntries = styled("div", {
  base: {
    borderRadius: theme.borderRadius,
    padding: `0 ${theme.space[4]}`,
    fontSize: theme.font.size.mono_sm,
    backgroundColor: theme.color.background.surface,
  },
});

const LogEntry = styled("div", {
  base: {
    ...utility.row(3.5),
    borderTop: `1px solid ${theme.color.divider.surface}`,
    paddingTop: theme.space[3],
    paddingBottom: theme.space[3],
    fontFamily: theme.font.family.code,
    selectors: {
      "&:first-child": {
        borderTop: "none",
      },
    },
  },
});

const LogEntryTime = styled("div", {
  base: {
    flexShrink: 0,
    minWidth: 89,
    textAlign: "left",
    color: theme.color.text.dimmed.base,
    lineHeight: theme.font.lineHeight,
  },
});

const LogEntryMessage = styled("span", {
  base: {
    minWidth: 0,
    whiteSpace: "pre-wrap",
    overflowWrap: "break-word",
    lineHeight: theme.font.lineHeight,
    color: theme.color.text.primary.surface,
  },
});

const LogMoreIndicator = styled("div", {
  base: {
    ...utility.row(2),
    alignItems: "center",
    padding: `${theme.space[3]} ${theme.space[3]}`,
    borderTop: `1px solid ${theme.color.divider.base}`,
  },
});

const LogMoreIndicatorIcon = styled("div", {
  base: {
    padding: 2,
    width: 20,
    height: 20,
    color: theme.color.text.dimmed.base,
    opacity: theme.iconOpacity,
  },
});

export function Logs() {
  const nav = useNavigate();
  const stage = useStageContext();
  const bar = useCommandBar();
  const params = useParams();
  const [query] = useSearchParams();
  const resources = useResourcesContext();
  const resource = createMemo(
    () =>
      resources().find((x) => x.id === params.resourceID) as
        | Extract<Resource.Info, { type: "Function" }>
        | undefined
  );
  const key = createMemo(() => [stage.app.name, resource()?.cfnID].join("-"));
  const lambdaPayloads = createSubscription(
    () => LambdaPayloadStore.forKey(key()),
    []
  );

  createEffect(() => {
    console.log("payloads", lambdaPayloads());
  });

  const live = createMemo(() => resource()?.enrichment.live);

  const functions = useFunctionsContext();
  const context = createMemo(() => {
    const parent = functions().get(resource()?.id || "")?.[0];
    if (!parent) return;

    switch (parent.type) {
      case "EventBus":
        return <Context type="EventBus" tag="Subscription" />;
      case "Api": {
        const route = parent.metadata.routes.find(
          (r) => r.fn?.node === resource()?.addr
        );
        if (route) {
          const [method, path] = route.route.split(" ");
          return <Context type="Api" tag={method} extra={path} />;
        }
        break;
      }
      case "ApiGatewayV1Api": {
        const route = parent.metadata.routes.find(
          (r) => r.fn?.node === resource()?.addr
        );
        if (route) {
          const [method, path] = route.route.split(" ");
          return <Context type="Api" tag={method} extra={path} />;
        }
        break;
      }
      case "WebSocketApi": {
        const route = parent.metadata.routes.find(
          (r) => r.fn?.node === resource()?.addr
        );
        if (route) {
          const [method, path] = route.route.split(" ");
          return <Context type="Api" tag={method} extra={path} />;
        }
        break;
      }
      case "Topic": {
        return <Context type="Topic" tag="Subscriber" />;
      }
      case "Bucket": {
        return <Context type="Bucket" tag="Notification" />;
      }
      case "KinesisStream": {
        return <Context type="KinesisStream" tag="Consumer" />;
      }
      case "AppSync": {
        return <Context type="AppSync" tag="Source" />;
      }
      case "Table": {
        return <Context type="Table" tag="Consumer" />;
      }
      case "Cognito": {
        return <Context type="Cognito" tag="Trigger" />;
      }
      case "Cron": {
        return <Context type="Cron" tag="Job" />;
      }
      case "Queue": {
        return <Context type="Queue" tag="Consumer" />;
      }
      case "NextjsSite": {
        return <Context type="NextjsSite" tag="Server" />;
      }
      case "SvelteKitSite": {
        return <Context type="SvelteKitSite" tag="Server" />;
      }
      case "RemixSite": {
        return <Context type="RemixSite" tag="Server" />;
      }
      case "AstroSite": {
        return <Context type="AstroSite" tag="Server" />;
      }
      case "SolidStartSite": {
        return <Context type="SolidStartSite" tag="Server" />;
      }
    }
  });

  const logGroup = createMemo(() => {
    if (params.resourceID.includes("arn")) {
      return params.resourceID
        .replace("function:", "log-group:/aws/lambda/")
        .replace("arn:aws:lambda", "arn:aws:logs");
    }
    const r = resource();
    if (!r) return "";
    const logGroup = (() => {
      if (r.type === "Function") {
        if (r.enrichment.live) return r.addr;
        return r.metadata.arn
          .replace("function:", "log-group:/aws/lambda/")
          .replace("arn:aws:lambda", "arn:aws:logs");
      }
      return "";
    })();

    return logGroup;
  });

  const [mode, setMode] = createSignal<string>("recent");

  const logGroupKey = createMemo(() => {
    const base = logGroup();
    if (live()) return base;
    return base + "-" + mode();
  });
  const invocations = createMemo(() => {
    const result = query.dummy ? DUMMY_LOGS : LogStore[logGroupKey()] || [];
    if (mode() === "tail" || live()) return result.slice().reverse();
    return result;
  });

  const rep = useReplicache();
  const poller = createSubscription(() =>
    LogPollerStore.fromLogGroup(logGroup())
  );

  createEffect(() => {
    console.log("resource", resource());
    if (!logGroup()) return;
    if (poller()) return;
    if (live()) return;
    if (mode() !== "tail") return;
    rep().mutate.log_poller_subscribe({
      logGroup: logGroup(),
      stageID: resources()?.at(0)?.stageID!,
    });
  });

  createEffect(() => {
    if (!logGroup()) return;
    if (live()) return;
    if (mode() !== "recent") return;
    rep().mutate.log_scan({
      logGroup: logGroup(),
      stageID: resources()?.at(0)?.stageID!,
      start: Date.now(),
    });
  });

  let invokeTextArea!: HTMLTextAreaElement;

  const [invoke, setInvoke] = createStore<{
    invoking: boolean;
    expand: boolean;
    empty: boolean;
  }>({
    expand: false,
    invoking: false,
    empty: true,
  });
  let saveControl!: DialogPayloadSaveControl;
  let manageControl!: DialogPayloadManageControl;

  function setPayload(value: any) {
    invokeTextArea.value = JSON.stringify(value, null, 2).trim();
    setInvoke("expand", true);
    invokeTextArea.focus();
    invokeTextArea.selectionStart = 0;
    invokeTextArea.selectionEnd = 0;
    invokeTextArea.scrollTop = 0;
  }

  bar.register("lambda-payloads", async (filter, global) => {
    if (global && !filter) return [];
    return lambdaPayloads().map((x) => ({
      icon: IconBookmark,
      category: "Event Payloads",
      title: x.name,
      async run(control) {
        setPayload(x.payload);
        control.hide();
      },
    }));
  });

  bar.register("invoke", async (filter, global) => {
    return [
      {
        icon: IconBookmark,
        category: "Invoke",
        title: "Load saved payloads...",
        async run(control) {
          control.show("lambda-payloads");
        },
      },
      {
        icon: IconBookmark,
        category: "Invoke",
        title: "Manage saved payloads...",
        async run(control) {
          control.hide();
          manageControl.show();
        },
      },
    ];
  });

  // MOCKUPS
  const isSearch = false;
  const isLoading = false;
  const isTryingToConnect = false;

  return (
    <Stack space="5">
      <DialogPayloadSave control={(control) => (saveControl = control)} />
      <DialogPayloadManage
        lambdaPayloads={lambdaPayloads()}
        onSelect={(item) => setPayload(item.payload)}
        control={(control) => (manageControl = control)}
      />
      <Row space="2" horizontal="between" vertical="center">
        <Stack space="2" vertical="center">
          <Text size="lg" weight="medium">
            Logs
          </Text>
          <Row
            space="1"
            horizontal="center"
            onClick={() => bar.show("resource")}
          >
            <Text code size="mono_base" color="secondary">
              {resource()?.metadata.handler}
            </Text>
            <LogSwitchIcon>
              <IconChevronUpDown />
            </LogSwitchIcon>
          </Row>
        </Stack>
        <Show when={live()}>
          <Tag level="tip" style="outline">
            Local
          </Tag>
        </Show>
      </Row>
      {/* <Show when={context()}>{context()}</Show> */}
      <LogList>
        <LogLoadingIndicator>
          <Row space="2" vertical="center">
            <LogLoadingIndicatorIcon pulse={!isSearch}>
              {isSearch ? (
                <IconArrowDown />
              ) : isTryingToConnect ? (
                <IconArrowsUpDown />
              ) : (
                <IconBoltSolid />
              )}
            </LogLoadingIndicatorIcon>
            <Row space="3" vertical="center">
              <Text leading="normal" color="dimmed" size="sm">
                {isSearch
                  ? `Viewing logs from ${new Date().toLocaleTimeString()}`
                  : isTryingToConnect
                  ? "Trying to connect to local `sst dev`"
                  : live()
                  ? "Tailing logs from local `sst dev`"
                  : "Tailing logs"}
                &hellip;
              </Text>
              <Show when={invocations().length > 0}>
                <LogClearButton
                  onClick={() => {
                    clearLogStore(logGroupKey());
                    bus.emit("log.cleared", {
                      functionID: logGroup(),
                    });
                  }}
                >
                  Clear
                </LogClearButton>
              </Show>
            </Row>
          </Row>
          <Show when={!live()}>
            <Dropdown>
              <Dropdown.RadioGroup value={mode()} onChange={setMode}>
                <Dropdown.RadioItem value="tail">Live</Dropdown.RadioItem>
                <Dropdown.RadioItem value="recent">Recent</Dropdown.RadioItem>
                <Dropdown.Seperator />
                <Dropdown.RadioItem value="5min">5min ago</Dropdown.RadioItem>
                <Dropdown.RadioItem value="15min">15min ago</Dropdown.RadioItem>
                <Dropdown.RadioItem value="1">1hr ago</Dropdown.RadioItem>
                <Dropdown.RadioItem value="6">6hrs ago</Dropdown.RadioItem>
                <Dropdown.RadioItem value="12">12hrs ago</Dropdown.RadioItem>
                <Dropdown.RadioItem value="24">1 day ago</Dropdown.RadioItem>
                <Dropdown.Seperator />
                <Dropdown.RadioItem value="custom">
                  Specify a time&hellip;
                </Dropdown.RadioItem>
              </Dropdown.RadioGroup>
            </Dropdown>
          </Show>
        </LogLoadingIndicator>
        <Show when={!isSearch}>
          <InvokeRoot
            expand={invoke.expand}
            style={{
              /** Overrides height set by Chrome after resizing **/
              height: "auto",
            }}
            onClick={() => {
              setInvoke("expand", true);
              invokeTextArea.focus();
            }}
          >
            <InvokePayloadLabel>
              <InvokePayloadLabelIcon>
                <IconCaretRightOutline />
              </InvokePayloadLabelIcon>
              <Text code size="mono_base" color="dimmed">
                Enter event payload
              </Text>
            </InvokePayloadLabel>
            <InvokeTextArea
              rows={7}
              spellcheck={false}
              ref={invokeTextArea}
              onInput={(e) => {
                setInvoke("empty", !Boolean(e.currentTarget.value));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.stopPropagation();
                  const payload = JSON.parse(invokeTextArea.value || "{}");
                  setTimeout(() => setInvoke("invoking", false), 2000);
                  setInvoke("invoking", true);
                  rep().mutate.function_invoke({
                    stageID: resource()!.stageID,
                    payload,
                    functionARN: resource()!.metadata.arn,
                  });
                }
              }}
            />
            <InvokeControls>
              <InvokeControlsLeft>
                <IconButton
                  title="Load saved payloads"
                  onClick={() => manageControl.show()}
                >
                  <IconBookmark display="block" width={24} height={24} />
                </IconButton>
                <LinkButton
                  style={{ display: invoke.empty ? "none" : "inline" }}
                  onClick={() =>
                    saveControl.show(key(), JSON.parse(invokeTextArea.value))
                  }
                >
                  Save
                </LinkButton>
              </InvokeControlsLeft>
              <Row vertical="center" space="4">
                <InvokeControlsCancel
                  onClick={(e) => {
                    e.stopPropagation();
                    setInvoke("expand", false);
                  }}
                >
                  Cancel
                </InvokeControlsCancel>
                <Button
                  color="secondary"
                  disabled={invoke.invoking}
                  onClick={(e) => {
                    e.stopPropagation();
                    const payload = JSON.parse(invokeTextArea.value || "{}");
                    setTimeout(() => setInvoke("invoking", false), 2000);
                    setInvoke("invoking", true);
                    rep().mutate.function_invoke({
                      stageID: resource()!.stageID,
                      payload,
                      functionARN: resource()!.metadata.arn,
                    });
                  }}
                >
                  {invoke.invoking ? "Invoking" : "Invoke"}
                </Button>
              </Row>
            </InvokeControls>
          </InvokeRoot>
        </Show>
        <Show when={isSearch && invocations().length === 0}>
          <LogEmpty>
            <IconMagnifyingGlass
              width={28}
              height={28}
              color={theme.color.icon.dimmed}
            />
            <Text center color="dimmed">
              Could not find any logs from {new Date().toLocaleTimeString()}
            </Text>
          </LogEmpty>
        </Show>
        <For each={invocations()}>
          {(invocation) => {
            const [expanded, setExpanded] = createSignal(false);
            const [tab, setTab] = createSignal<
              "details" | "request" | "response"
            >("details");

            const shortDate = createMemo(() =>
              new Intl.DateTimeFormat("en-US", shortDateOptions)
                .format(invocation.start)
                .replace(" at ", ", ")
            );
            const longDate = createMemo(() =>
              new Intl.DateTimeFormat("en-US", longDateOptions).format(
                invocation.start
              )
            );
            const empty = createMemo(
              () => !live() && invocation.logs.length === 0
            );
            const [replaying, setReplaying] = createSignal(false);

            return (
              <LogContainer
                expanded={expanded()}
                level={invocation.error ? "error" : "info"}
              >
                <LogSummary
                  loading={empty()}
                  onClick={() => setExpanded((r) => !empty() && !r)}
                >
                  <Row shrink={false} space="2" vertical="center">
                    <CaretIcon>
                      <IconCaretRight />
                    </CaretIcon>
                    <LogLevel level={invocation.error ? "error" : "info"} />
                  </Row>
                  <LogDate title={longDate()}>{shortDate()}</LogDate>
                  <LogDuration
                    coldStart={invocation.cold}
                    title={invocation.cold ? "Cold start" : ""}
                  >
                    {invocation.duration
                      ? formatTime(invocation.duration)
                      : "-"}
                  </LogDuration>
                  <LogRequestId title="Request Id">
                    {invocation.id}
                  </LogRequestId>
                  <LogMessage>
                    <Show when={invocation.logs.length > 0}>
                      {invocation.logs[0].message}
                    </Show>
                  </LogMessage>
                </LogSummary>
                <Show when={expanded()}>
                  <LogDetail>
                    <LogDetailHeader>
                      <Row space="5" vertical="center">
                        <LogDetailHeaderTitle
                          onClick={() => setTab("details")}
                          state={
                            live()
                              ? tab() === "details"
                                ? "active"
                                : "inactive"
                              : "inactive"
                          }
                        >
                          Details
                        </LogDetailHeaderTitle>
                        <Show when={live()}>
                          <LogDetailHeaderTitle
                            onClick={() => setTab("request")}
                            state={
                              !invocation.event
                                ? "disabled"
                                : tab() === "request"
                                ? "active"
                                : "inactive"
                            }
                          >
                            Request
                          </LogDetailHeaderTitle>
                          <LogDetailHeaderTitle
                            onClick={() => setTab("response")}
                            state={
                              !invocation.response
                                ? "disabled"
                                : tab() === "response"
                                ? "active"
                                : "inactive"
                            }
                          >
                            Response
                          </LogDetailHeaderTitle>
                        </Show>
                      </Row>
                      <Show when={invocation.event}>
                        <Row space="4">
                          <TextButton
                            on="surface"
                            icon={<IconBookmark />}
                            onClick={() =>
                              saveControl.show(
                                key(),
                                structuredClone(unwrap(invocation.event))
                              )
                            }
                          >
                            Save
                          </TextButton>
                          <TextButton
                            on="surface"
                            completing={replaying()}
                            icon={<IconArrowPath />}
                            onClick={() => {
                              setReplaying(true);
                              rep().mutate.function_invoke({
                                stageID: resource()!.stageID,
                                payload: structuredClone(
                                  unwrap(invocation.event)
                                ),
                                functionARN: resource()!.metadata.arn,
                              });
                              setTimeout(() => setReplaying(false), 2000);
                            }}
                          >
                            Replay
                          </TextButton>
                        </Row>
                      </Show>
                    </LogDetailHeader>
                    <LogEntries>
                      <Switch>
                        <Match when={tab() === "details"}>
                          {invocation.logs.map((entry) => (
                            <LogEntry>
                              <LogEntryTime>
                                {entry.timestamp.toLocaleTimeString()}
                              </LogEntryTime>
                              <LogEntryMessage>{entry.message}</LogEntryMessage>
                            </LogEntry>
                          ))}
                        </Match>
                        <Match when={tab() === "request"}>
                          <LogEntry>
                            <LogEntryMessage>
                              {JSON.stringify(invocation.event, null, 2)}
                            </LogEntryMessage>
                          </LogEntry>
                        </Match>
                        <Match when={tab() === "response"}>
                          <LogEntry>
                            <LogEntryMessage>
                              {JSON.stringify(
                                invocation.response || invocation.error,
                                null,
                                2
                              )}
                            </LogEntryMessage>
                          </LogEntry>
                        </Match>
                      </Switch>
                    </LogEntries>
                  </LogDetail>
                </Show>
              </LogContainer>
            );
          }}
        </For>
        <Show when={isLoading}>
          <LogMoreIndicator>
            <LogMoreIndicatorIcon>
              <IconArrowPathSpin />
            </LogMoreIndicatorIcon>
            <Text leading="normal" color="dimmed" size="sm">
              Loading more logs&hellip;
            </Text>
          </LogMoreIndicator>
        </Show>
      </LogList>
    </Stack>
  );
}

function Context(props: {
  tag?: string;
  type?: Resource.Info["type"];
  extra?: string;
}) {
  const icon = createMemo(() => props.type && IconMap[props.type]);
  return (
    <Row vertical="center" space="3">
      <Show when={props.tag}>
        <Tag style="outline">{props.tag}</Tag>
      </Show>
      <Row vertical="center" space="2">
        <Show when={icon()}>
          {icon()!({
            width: 13,
            height: 13,
          })}
          <Text size="sm" color="secondary" on="base">
            {props.type}
          </Text>
        </Show>
      </Row>
      <Show when={props.extra}>
        <Text size="sm" color="secondary" on="base">
          {props.extra!}
        </Text>
      </Show>
    </Row>
  );
}

function LogLevel(props: { level?: string }) {
  props = mergeProps({ level: "info" }, props);
  return (
    <Tag
      size="small"
      style="solid"
      level={props.level === "error" ? "danger" : "info"}
    >
      {props.level}
    </Tag>
  );
}

function formatTime(milliseconds: number) {
  return milliseconds < 1000
    ? milliseconds.toFixed(0) + "ms"
    : (milliseconds / 1000).toFixed(2) + "s";
}

const shortDateOptions: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  hour: "numeric",
  hour12: true,
  minute: "numeric",
  second: "numeric",
  timeZoneName: "short",
};
const longDateOptions: Intl.DateTimeFormatOptions = {
  ...shortDateOptions,
  timeZone: "UTC",
  year: "numeric",
};
