/** Component inventory A–H. Label text must match the reference exactly (CLAUDE.md §3). */
export type ComponentId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';

export interface ComponentInfo {
  title: string;
  sub: string;
  description: string;
}

export const COMPONENT_IDS: ComponentId[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export const COMPONENTS: Record<ComponentId, ComponentInfo> = {
  A: {
    title: 'A. Lid',
    sub: '(Waste disposal area)',
    description:
      'Lid (waste disposal area). 1–2 kg of food waste is put into the deposit hopper under this hinged lid. ' +
      'Close the lid and press the Start button to begin the cycle.',
  },
  B: {
    title: 'B. Grinding area',
    sub: '(Stainless steel blades)',
    description:
      'The grinding unit is the first stage of the bio-waste disposer. Once the waste is deposited, it is processed by ' +
      'high-grade stainless steel blades that reduce large organic materials into smaller, uniform particles. This ensures ' +
      'that the waste can be efficiently dried and processed in the following stages. The grinding process also helps ' +
      'separate liquid and solid components, with the liquid being drained away at this stage to optimize drying later on.',
  },
  C: {
    title: 'C. Liquid separation',
    sub: '(Filtered solid moves down)',
    description:
      'Elimination of liquid: here the liquid waste is removed, and the solid filtrate collects at the bottom. The ' +
      'perforated stainless basket drains liquid to the outlet, then its louvred floor opens so the solids drop into the ' +
      'drying area.',
  },
  D: {
    title: 'D. Liquid outlet',
    sub: '(To collect waste liquid)',
    description:
      'Liquid outlet. Waste liquid removed in the separation stage drains through a stainless pipe into a removable ' +
      'clear container.',
  },
  E: {
    title: 'E. Drying area',
    sub: '(Hot air + stirring)',
    description:
      'The drying unit is where most of the moisture is removed from the waste. Hot air is circulated around the waste ' +
      'using an internal heating coil, and the waste is stirred continuously to promote even drying. A motor-driven ' +
      'central paddle rotates the waste, ensuring thorough air exposure. The drying unit significantly reduces the ' +
      'overall mass and volume of the waste before it moves to the next stage.',
  },
  F: {
    title: 'F1 & F2. IR Lamps',
    sub: '(Dehydrates remaining moisture)',
    description:
      'The IR (Infrared) lamp is an essential component that further accelerates the drying process by removing any ' +
      'residual moisture after the hot air treatment. The IR lamp is adjustable, allowing the intensity to be modified ' +
      'depending on the type and quantity of waste. This ensures that the final biomass is dry and odorless, ready to be ' +
      'collected and used as fertilizer. (F1 = right wall, F2 = left wall.)',
  },
  G: {
    title: 'G. Exhaust',
    sub: '(Removes odour and vapour)',
    description:
      'An exhaust system is fitted at the top of the device to manage airflow and odor control. Hot, moist air is vented ' +
      'out, preventing the build-up of unpleasant smells. The exhaust includes a filtration system to trap any odors or ' +
      'particulate matter, ensuring the surroundings remain clean and odor-free.',
  },
  H: {
    title: 'H. Biomass collection tray',
    sub: '(Collects dry, odorless output)',
    description:
      'Once the waste has been dried and treated, the final product—dry, odorless biomass—collects in a tray at the bottom ' +
      'of the device. This biomass can be directly used as fertilizer for home gardens or small-scale agricultural ' +
      'purposes. The tray is easy to remove, clean, and replace for continuous operation.',
  },
};
