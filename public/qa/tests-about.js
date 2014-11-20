/**
 * Created by Steph on 11/19/2014.
 */
suite('"About" Page Tests', function(){
    test('page should contain link to contact page', function(){
        assert($('[href="/contact"]').length);
    });
});