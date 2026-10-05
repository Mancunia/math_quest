import type { Lesson, TopicId } from "./types";

/**
 * Short picture lessons shown before a round, one list per level (Easy, Medium, Hard).
 * A topic with no entry here starts straight away.
 */
export const LESSONS: Partial<Record<TopicId, [Lesson[], Lesson[], Lesson[]]>> = {
  shapes: [
    [
      {
        title: "Meet the shapes",
        text: "Shapes are all around us. Here are six you will see a lot.",
        visual: { type: "gallery", items: ["circle", "triangle", "square", "rectangle", "pentagon", "hexagon"] },
      },
      {
        title: "Sides",
        text: "Sides are the straight lines around a shape. A square has 4 sides, all the same length.",
        visual: { type: "shape2d", shape: "square", marks: "sides" },
      },
      {
        title: "Corners",
        text: "A corner is where two sides meet. A triangle has 3 sides and 3 corners.",
        visual: { type: "shape2d", shape: "triangle", marks: "corners" },
      },
      {
        title: "Squares and rectangles",
        text: "A rectangle also has 4 sides, but two are long and two are short.",
        visual: { type: "shape2d", shape: "rectangle", marks: "sides" },
      },
      {
        title: "Circles",
        text: "A circle is round. It has no straight sides and no corners.",
        visual: { type: "shape2d", shape: "circle", label: true },
      },
    ],
    [
      {
        title: "Count the sides",
        text: "A pentagon has 5 sides, a hexagon 6, a heptagon 7 and an octagon 8. A shape always has as many corners as sides.",
        visual: { type: "shape2d", shape: "octagon", marks: "sides" },
      },
      {
        title: "Lines of symmetry",
        text: "A line of symmetry folds a shape into two halves that match exactly. A rectangle has 2.",
        visual: { type: "shape2d", shape: "rectangle", marks: "symmetry" },
      },
      {
        title: "Regular shapes",
        text: "When all the sides are the same length, there is one line of symmetry for every side. A square has 4.",
        visual: { type: "shape2d", shape: "square", marks: "symmetry" },
      },
      {
        title: "3D shapes",
        text: "3D shapes are solid. You can pick them up and hold them.",
        visual: { type: "gallery", items: ["cube", "cuboid", "sphere", "cylinder", "cone", "pyramid"] },
      },
    ],
    [
      {
        title: "Faces, edges and vertices",
        text: "Faces are the flat surfaces. Edges are where two faces meet. Vertices are the corners. A cube has 6 faces, 12 edges and 8 vertices. Dashed lines are edges hidden at the back.",
        visual: { type: "solid", solid: "cube", marks: "vertices" },
      },
      {
        title: "Prisms and pyramids",
        text: "A prism has the same shape all the way through. A pyramid comes to a point at the top.",
        visual: { type: "gallery", items: ["prism", "pyramid", "tetrahedron"] },
      },
      {
        title: "Angles",
        text: "A right angle is a square corner (90°). Acute is smaller, obtuse is between 90° and 180°, and reflex is more than 180°.",
        visual: { type: "angles" },
      },
      {
        title: "Perimeter",
        text: "Perimeter is the distance all the way round. Add up every side: 6 + 3 + 6 + 3 = 18 cm.",
        visual: { type: "rect", w: 6, h: 3, show: "all" },
      },
      {
        title: "Area",
        text: "Area is the space inside, counted in squares. 3 rows of 5 squares is 5 × 3 = 15 cm².",
        visual: { type: "rect", w: 5, h: 3, show: "grid" },
      },
    ],
  ],
};
