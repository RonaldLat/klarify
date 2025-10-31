export const load = async ({ locals }) => {
  const { user, session } = locals;
// console.log('locals',locals)
  return { user, session , name:"lat"};
};
