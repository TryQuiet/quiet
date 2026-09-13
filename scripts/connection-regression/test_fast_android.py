import unittest
from fast_android import parse_result


class InstrumentationResultTest(unittest.TestCase):
    def test_requires_native_success_status_and_single_passed_result(self):
        output='INSTRUMENTATION_RESULT: result={"passed":true,"bounds":"[1,2][3,4]"}\nINSTRUMENTATION_CODE: -1\n'
        self.assertEqual(parse_result(output)['bounds'],'[1,2][3,4]')
        with self.assertRaises(RuntimeError):parse_result(output.replace('-1','0'))
        with self.assertRaises(RuntimeError):parse_result(output+output)
        with self.assertRaises(RuntimeError):parse_result('INSTRUMENTATION_CODE: -1\n')

    def test_surfaces_actual_ui_failure_instead_of_treating_shell_exit_as_success(self):
        output='INSTRUMENTATION_RESULT: result={"passed":false,"error":"Native text entry failed"}\nINSTRUMENTATION_CODE: 0\n'
        with self.assertRaisesRegex(RuntimeError,'Native text entry failed'):parse_result(output)
