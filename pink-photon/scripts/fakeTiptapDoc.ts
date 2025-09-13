import { faker } from "@faker-js/faker";

function fakeTiptapDoc(): any {
  const nodes: any[] = [];

  nodes.push({
    type: "heading",
    attrs: { level: 2 },
    content: [{ type: "text", text: faker.lorem.sentence() }],
  });

   nodes.push({
      type: "image",
      attrs: {
        src: faker.image.url(),
        alt: faker.lorem.words(3),
        title: faker.lorem.word(),
      },
    });



  for (let i = 0; i < faker.number.int({ min: 2, max: 4 }); i++) {
    nodes.push({
      type: "paragraph",
      content: [
        { type: "text", text: faker.lorem.sentence(), marks: [{ type: "bold" }] },
        { type: "text", text: " " + faker.lorem.paragraph() },
      ],
    });
  }

     nodes.push({
    type: "bulletList",
    content: Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, () => ({
      type: "listItem",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: faker.lorem.words(5) }],
        },
      ],
    })),
  });

  nodes.push({
    type: "paragraph",
    content: [{ type: "text", text: faker.lorem.paragraphs(2) }],
  });

  return {
    type: "doc",
    content: nodes,
  };
}

export { fakeTiptapDoc };


