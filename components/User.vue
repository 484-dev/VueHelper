<template>
  <div class="user" :class="getDirectionClass(1)">
    <div :class="getDirectionClass(2,3)">
      <q-img
        :src="format(userCopy,options,'image','https://placeimg.com/500/300/nature')"
        :ratio="1"
        class="user--image"
      />
    </div>
    <div :class="getDirectionClass(2,8)">
      
    </div>
  </div>
</template>

<script>
export default {
  name: 'User',
  methods: {
    getDirectionClass(level, size) {
      const classes = []
      let highDirection =
        (this.direction || this.options.direction) == 'lr' ||
        (this.direction || this.options.direction) == 'rl'
          ? 'horizontal'
          : 'vertical'
      // Spacing
      // COTES - consider how we could pass sizing (xs, sm, md, lg, xl) in to:
      let spacing = 'sm'
      if (spacing && level == 1) {
        classes.push(`q-${highDirection == 'horizontal' ? 'col-' : ''}gutter-${spacing}`)
      }
      // Horizontal
      if (highDirection == 'horizontal') {
        classes.push(level == 1 ? 'row' : 'col')
        if (size && level == 2) {
          classes.push('col-' + size)
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
  computed: {
    userCopy: {
      get () { return this.value },
      set (value) {
        this.$emit('input', value)
      },
    },
  },
  props: {
    direction: { type: String },
    content: {
      required: false
    },
    value: {
      required: true
    }
  }
}
</script>