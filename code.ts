const xMapper: Record<
  ConstraintType,
  ({ bbox, parentBbox }: { bbox: Rect; parentBbox: Rect }) => unknown
> = {
  MIN: ({ bbox, parentBbox }) => ({ Left: bbox.x - parentBbox.x }),
  CENTER: ({ bbox, parentBbox }) => ({ Center: bbox.x - parentBbox.x }),
  MAX: ({ bbox, parentBbox }) => ({
    Right: bbox.x + bbox.width - (parentBbox.x + parentBbox.width),
  }),
  STRETCH: ({ bbox, parentBbox }) => ({
    LeftAndRight: {
      left: bbox.x - parentBbox.x,
      right: bbox.x + bbox.width - (parentBbox.x + parentBbox.width),
    },
  }),
  SCALE: () => "Scale",
} as const;
const yMapper: Record<
  ConstraintType,
  ({ bbox, parentBbox }: { bbox: Rect; parentBbox: Rect }) => unknown
> = {
  MIN: ({ bbox, parentBbox }) => ({ Top: bbox.y - parentBbox.y }),
  CENTER: ({ bbox, parentBbox }) => ({ Center: bbox.y - parentBbox.y }),
  MAX: ({ bbox, parentBbox }) => ({
    Bottom: bbox.y + bbox.height - (parentBbox.y + parentBbox.height),
  }),
  STRETCH: ({ bbox, parentBbox }) => ({
    LeftAndRight: {
      left: bbox.y - parentBbox.y,
      right: bbox.y + bbox.height - (parentBbox.y + parentBbox.height),
    },
  }),
  SCALE: () => "Scale",
} as const;

const attributeGetter = (component: SceneNode) => {
  const constraints = "constraints" in component && component.constraints;
  const bbox =
    "absoluteBoundingBox" in component && component.absoluteBoundingBox;
  const parentBbox =
    component.parent &&
    "absoluteBoundingBox" in component.parent &&
    component.parent.absoluteBoundingBox;

  if (constraints && bbox && parentBbox) {
    const json = {
      x: xMapper[constraints.horizontal]({ bbox, parentBbox }),
      y: yMapper[constraints.vertical]({ bbox, parentBbox }),
    };
    return { [component.name]: json };
  } else {
    return {};
  }
};

const recurseChildren = (
  parent: SceneNode,
  func: (child: SceneNode) => Record<string, { x: unknown; y: unknown }>
): Record<string, { x: unknown; y: unknown }> => {
  if ("children" in parent) {
    return parent.children.reduce((acc, child) => {
      return { ...acc, ...func(child), ...recurseChildren(child, func) };
    }, {});
  }
  return {};
};

if (figma.editorType === "figma") {
  const json = figma.currentPage.selection.map((child) =>
    recurseChildren(child, attributeGetter)
  )[0];
  console.log(JSON.stringify(json));

  // Make sure to close the plugin when you're done. Otherwise the plugin will
  // keep running, which shows the cancel button at the bottom of the screen.
  figma.closePlugin();
}
