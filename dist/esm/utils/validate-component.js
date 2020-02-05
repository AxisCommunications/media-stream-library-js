/**
 * Tests for validating generic component properties.
 * These should be run for each derived Component.
 * @param  {Component} component The component instance to test.
 * @param  {String} [name=''] A name for the component.
 * @return {undefined}
 */
export const runComponentTests = (component, name = '') => {
    test(`${name} should have incoming/outgoing stream`, () => {
        expect(component.incoming).toBeDefined();
        expect(component.outgoing).toBeDefined();
    });
    test(`${name} should have complementary streams`, () => {
        expect(component.incoming.readable).toEqual(component.outgoing.writable);
        expect(component.incoming.writable).toEqual(component.outgoing.readable);
    });
    test(`${name} should have objectMode on all streams`, () => {
        const incoming = component.incoming;
        const outgoing = component.outgoing;
        incoming.ReadableState &&
            expect(incoming.ReadableState.objectMode).toBe(true);
        incoming.WritableState &&
            expect(incoming.WritableState.objectMode).toBe(true);
        outgoing.ReadableState &&
            expect(outgoing.ReadableState.objectMode).toBe(true);
        outgoing.WritableState &&
            expect(outgoing.WritableState.objectMode).toBe(true);
    });
};
//# sourceMappingURL=validate-component.js.map