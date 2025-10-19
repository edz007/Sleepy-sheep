export interface ExerciseScript {
  title: string;
  duration: string;
  script: string;
  emoji: string;
}

export const exerciseScripts: Record<string, ExerciseScript> = {
  '4-7-8': {
    title: '4-7-8 Breathing Technique',
    duration: '5 minutes',
    emoji: '🫁',
    script: `Welcome to the 4-7-8 breathing exercise. This technique will help calm your nervous system and prepare you for sleep. Find a comfortable position, either sitting or lying down, and close your eyes gently.

We'll breathe together for 4 complete cycles. This exercise activates your parasympathetic nervous system, which helps your body relax.

Let's begin. Place the tip of your tongue behind your upper front teeth and keep it there throughout the exercise.

First cycle: Inhale quietly through your nose for 4 counts... 1, 2, 3, 4. Now hold your breath for 7 counts... 1, 2, 3, 4, 5, 6, 7. Now exhale completely through your mouth for 8 counts... 1, 2, 3, 4, 5, 6, 7, 8.

Second cycle: Inhale through your nose for 4 counts... 1, 2, 3, 4. Hold your breath for 7 counts... 1, 2, 3, 4, 5, 6, 7. Exhale through your mouth for 8 counts... 1, 2, 3, 4, 5, 6, 7, 8.

Third cycle: Inhale through your nose for 4 counts... 1, 2, 3, 4. Hold your breath for 7 counts... 1, 2, 3, 4, 5, 6, 7. Exhale through your mouth for 8 counts... 1, 2, 3, 4, 5, 6, 7, 8.

Final cycle: Inhale through your nose for 4 counts... 1, 2, 3, 4. Hold your breath for 7 counts... 1, 2, 3, 4, 5, 6, 7. Exhale through your mouth for 8 counts... 1, 2, 3, 4, 5, 6, 7, 8.

Well done. Notice how relaxed and calm you feel. Your heart rate has slowed, and your body is preparing for rest. You can repeat this exercise anytime you feel stressed or need to relax.`
  },
  'body-scan': {
    title: 'Body Scan Meditation',
    duration: '10 minutes',
    emoji: '🧘',
    script: `Welcome to the body scan meditation. This practice will help you release tension and prepare your body for deep sleep. Lie down comfortably on your back, with your arms at your sides and your legs slightly apart. Close your eyes and take three deep breaths.

We'll systematically move through your body, bringing awareness to each part and releasing any tension we find. There's no need to force relaxation - simply notice what's there and let it be.

Begin by bringing your attention to your toes. Notice any sensations - warmth, coolness, tingling, or perhaps nothing at all. Take a moment to breathe into your toes, and as you exhale, imagine any tension melting away.

Now move your attention to your feet. Feel the weight of your feet against the surface beneath you. Notice the arches, the heels, the tops of your feet. Breathe into your feet and let them relax completely.

Bring your awareness to your calves. Feel the muscles, the bones, the skin. Notice any tightness or tension, and simply observe it without judgment. As you breathe out, imagine the tension dissolving.

Move up to your thighs. Feel the weight and warmth of your legs. Notice any sensations in your thigh muscles. Breathe into your thighs and let them become heavy and relaxed.

Now bring your attention to your hips and pelvis. Feel the connection between your upper and lower body. Notice any tension in your hip joints and let it release with each breath.

Move up to your abdomen. Feel your belly rising and falling with each breath. Notice any tightness in your stomach muscles and let them soften.

Bring your awareness to your chest. Feel your heart beating, your lungs expanding and contracting. Notice the gentle movement of your ribcage with each breath.

Now focus on your hands. Feel your fingers, palms, and the backs of your hands. Notice any tension in your hands and let them relax completely.

Move your attention to your arms. Feel your forearms, elbows, and upper arms. Let any tension in your arms melt away with each breath.

Bring your awareness to your shoulders. These often carry a lot of tension. Notice any tightness and imagine it dissolving with each exhale.

Now focus on your neck. Feel the muscles supporting your head. Let any tension in your neck release, allowing your head to rest comfortably.

Finally, bring your attention to your face. Feel your jaw, your cheeks, your forehead. Notice any tension in your facial muscles and let them relax completely.

Your entire body is now deeply relaxed. Feel the heaviness and warmth throughout your body. You are calm, peaceful, and ready for rest.`
  },
  'breath-mindfulness': {
    title: 'Breath Mindfulness',
    duration: '7 minutes',
    emoji: '🌬️',
    script: `Welcome to breath mindfulness meditation. This practice will help you focus your mind and prepare for peaceful sleep. Find a comfortable seated position with your back straight but not rigid. You can also lie down if you prefer. Close your eyes gently and take three deep breaths.

We'll focus our attention on the natural rhythm of your breathing. There's no need to change or control your breath - simply observe it as it is.

Begin by bringing your attention to your breath. Notice the sensation of air entering your nostrils. Feel the coolness of the incoming breath and the warmth of the outgoing breath.

Follow your breath as it travels down into your lungs. Feel your chest and belly gently expanding as you inhale, and contracting as you exhale.

Notice the natural pause at the top of your inhale - that brief moment before the exhale begins. And notice the pause at the bottom of your exhale - that gentle stillness before the next breath begins.

Your breath is like an anchor, keeping you present in this moment. When your mind wanders to thoughts about the day, worries about tomorrow, or any other distractions, gently acknowledge them without judgment and return your attention to your breath.

Each time you notice your mind has wandered, simply say to yourself "thinking" and gently guide your attention back to the sensation of breathing.

Notice how each breath is unique - slightly different in depth, rhythm, and sensation. No two breaths are exactly the same.

Feel the rhythm of your breathing - the gentle rise and fall, the natural flow of air in and out of your body.

As you continue to breathe, feel yourself becoming more relaxed and centered. Your mind is becoming calmer, your body more peaceful.

With each breath, you're letting go of the day's activities and preparing for rest. Each exhale carries away tension and stress.

Your breath is always with you, a constant companion that can bring you back to peace and calm whenever you need it.

Continue to breathe mindfully for a few more moments, feeling the peace and stillness that comes with focused attention on your breath.

When you're ready, slowly open your eyes. You are calm, present, and ready for peaceful sleep.`
  }
};

export const exerciseTypes = [
  { id: '4-7-8', ...exerciseScripts['4-7-8'] },
  { id: 'body-scan', ...exerciseScripts['body-scan'] },
  { id: 'breath-mindfulness', ...exerciseScripts['breath-mindfulness'] }
];
