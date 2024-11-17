import { FirebaseTimePipe } from './firebase-time.pipe';

describe('FirebaseTimePipe', () => {
  it('create an instance', () => {
    const pipe = new FirebaseTimePipe();
    expect(pipe).toBeTruthy();
  });
});
