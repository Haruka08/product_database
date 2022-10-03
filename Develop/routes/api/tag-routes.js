const router = require('express').Router();
const { Tag, Product, ProductTag } = require('../../models');

// The `/api/tags` endpoint

router.get('/', async (req, res) => {
  // find all tags
  // be sure to include its associated Product data
  try {
    const tagData = await Tag.findAll({
      include: [{ model: Product, through: ProductTag }],
    });
    res.status(200).json(tagData);
  } catch (err) {
    res.status(500).json(err);
  }


});

router.get('/:id', async (req, res) => {
  // find a single tag by its `id`
  // be sure to include its associated Product data
  try {
    const tagData = await Tag.findByPk(req.params.id, {
      include: [{ model: Product, through: ProductTag }],
    });

    if (!tagData) {
      res.status(404).json({ message: 'No category found with that id!' });
      return;
    }

    res.status(200).json(tagData);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.post('/', (req, res) => {
  // create a new tag
  Tag.create(req.body)
    .then((tag) => {
      // if there's product tags, we need to create pairings to bulk create in the ProductTag model
      if (req.body.tagIds.length) {
        const productTagIdArr = req.body.tagIds.map((product_id) => {
          return {
            tag_id: tag.id,
            product_id,
          };
        });
        return Tag.bulkCreate(productTagIdArr);
      }
      // if no product tags, just respond
      res.status(200).json(tag);
    })
    .then((tagIds) => res.status(200).json(tagIds))
    .catch((err) => {
      console.log(err);
      res.status(400).json(err);
    });

});

router.put('/:id', (req, res) => {
  // update a tag's name by its `id` value
    // update product data
    Tag.update(req.body, {
      where: {
        id: req.params.id,
      },
    })
      .then((tag) => {
        // find all associated tags from ProductTag
        return ProductTag.findAll({ where: { tag_id: req.params.id } });
      })
      .then((tags) => {
        // get list of current tag_ids
        const tagIds = tags.map(({ tag_id }) => tag_id);
        // create filtered list of new tag_ids
        const newTags = req.body.tagIds
          .filter((tag_id) => !tagIds.includes(tag_id))
          .map((tag_id) => {
            return {
              tag_id: req.params.id,
              tag_id,
            };
          });
        // figure out which ones to remove
        const tagsToRemove = tags
          .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id))
          .map(({ id }) => id);
  
        // run both actions
        return Promise.all([
          Tag.destroy({ where: { id: tagsToRemove } }),
          Tag.bulkCreate(newTags),
        ]);
      })
      .then((updatedTags) => res.json(updatedTags))
      .catch((err) => {
        // console.log(err);
        res.status(400).json(err);
      });
});

router.delete('/:id', async (req, res) => {
  // delete on tag by its `id` value
  try {
    const tagData = await Tag.destroy({
      where: {
        id: req.params.id,
      },
    });

    if (!tagData) {
      res.status(404).json({ message: 'No reader found with that id!' });
      return;
    }

    res.status(200).json(tagData);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
