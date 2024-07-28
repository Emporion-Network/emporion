#[macro_export]
macro_rules! if_test {
    ($left:expr, $right:expr) => {
        if cfg!(test) {
            $left
        } else {
            $right
        }
    };
}
