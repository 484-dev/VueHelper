<template>
  <div class="user" :class="getDirectionClass(1)">
    <div :class="getDirectionClass(2,3)" v-if="image">
      <q-img
        :src="image.url && image.url() || image || 'https://placeimg.com/500/300/nature'"
        :ratio="1"
        class="user--image"
      />
    </div>
    <div :class="getDirectionClass(2,8)">
        <div v-if="before" class="before" :class="(beforeClass || []).join(' ')">{{before}}</div>
         <h2 v-if="title" class="q-my-none">{{title}}</h2>
         <h5 v-if="subtitle" class="q-my-none">{{subtitle}}</h5>
         <slot v-if="$slots.after" name="after"></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'User',
  methods: {
    getDirectionClass(level, size) {
      const classes = []
      const highDirection =
        (this.direction || this.options.direction) == 'lr' ||
        (this.direction || this.options.direction) == 'rl'
          ? 'horizontal'
          : 'vertical'
      // Spacing
      // COTES - consider how we could pass sizing (xs, sm, md, lg, xl) in to:
      const spacing = 'sm'
      if (spacing && level == 1) {
        classes.push(`q-${highDirection == 'horizontal' ? 'col-' : ''}gutter-${spacing}`)
      }
      // Horizontal
      if (highDirection == 'horizontal') {
        classes.push(level == 1 ? 'row' : 'col')
        if (size && level == 2) {
          classes.push(`col-${  size}`)
        }
      }
      // Vertical
      if (highDirection == 'vertical') {
        classes.push(level == 1 ? 'col' : 'row')
      }
      // Direction flip
      if (
        level == 1 &&
        ((this.direction || this.options.direction) == 'rl' ||
          (this.direction || this.options.direction) == 'bt')
      ) {
        classes.push(
          (this.direction || this.options.direction) == 'bt' ? 'column reverse' : 'reverse'
        )
      }
      // Column Sizing
      return classes.join(' ')
    }
  },
  props: {
    direction: { type: String },
    image: {type: Object},
    before: { type: String},
    beforeClass: { type: String},
    title: { type: String},
    subtitle: { type: String},
  }
}
</script>
