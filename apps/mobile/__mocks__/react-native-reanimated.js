const React = require('react');
const { ScrollView, View } = require('react-native');

const mockAnimationBuilder = {
  delay: () => mockAnimationBuilder,
  duration: () => mockAnimationBuilder,
};

const AnimatedView = React.forwardRef((props, ref) =>
  React.createElement(View, { ...props, ref }),
);

const AnimatedScrollView = React.forwardRef((props, ref) =>
  React.createElement(ScrollView, { ...props, ref }),
);

const mockModule = {
  __esModule: true,
  default: {
    ScrollView: AnimatedScrollView,
    View: AnimatedView,
    call: () => {},
  },
  FadeInDown: mockAnimationBuilder,
  ScrollView: AnimatedScrollView,
  View: AnimatedView,
  runOnJS: fn => fn,
  useAnimatedStyle: updater => updater(),
  useSharedValue: value => ({ value }),
  withTiming: value => value,
};

module.exports = mockModule;
