const xMapper: Record<
  ConstraintType,
  ({ bbox, parentBbox }: { bbox: Rect; parentBbox: Rect }) => unknown
> = {
  MIN: ({ bbox, parentBbox }) => ({ Left: bbox.x - parentBbox.x }),
  CENTER: ({ bbox, parentBbox }) => ({
    Center: bbox.x + bbox.width / 2 - (parentBbox.x + parentBbox.width / 2),
  }),
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
  CENTER: ({ bbox, parentBbox }) => ({
    Center: bbox.y + bbox.height / 2 - (parentBbox.y + parentBbox.height / 2),
  }),
  MAX: ({ bbox, parentBbox }) => ({
    Bottom: bbox.y + bbox.height - (parentBbox.y + parentBbox.height),
  }),
  STRETCH: ({ bbox, parentBbox }) => ({
    TopAndBottom: {
      top: bbox.y - parentBbox.y,
      bottom: bbox.y + bbox.height - (parentBbox.y + parentBbox.height),
    },
  }),
  SCALE: () => "Scale",
} as const;

const recurseChildren = <T>(
  parent: SceneNode,
  func: (child: SceneNode) => Record<string, T>
): Record<string, T> => {
  if ("children" in parent) {
    return parent.children.reduce((acc, child) => {
      return {
        ...acc,
        ...func(parent),
        ...recurseChildren(child, func),
      };
    }, {});
  }
  return { ...func(parent) };
};

const attributeGetter = (component: SceneNode) => {
  let constraints = "constraints" in component && component.constraints;

  recurseChildren(component, (child) => {
    if (!constraints && "constraints" in child) {
      constraints = child.constraints;
    }
    return {};
  });

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
    console.log(component.name, constraints, bbox, parentBbox);
    return {};
  }
};

if (figma.editorType === "figma") {
  const json = figma.currentPage.selection.map((child) =>
    recurseChildren(child, attributeGetter)
  )[0];
  console.log(JSON.stringify(json, null, 2));

  // Make sure to close the plugin when you're done. Otherwise the plugin will
  // keep running, which shows the cancel button at the bottom of the screen.
  figma.closePlugin();
}
